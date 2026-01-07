import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Inject,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case';
import { GetAllEventsUseCase } from '../../application/use-cases/get-all-events.use-case';
import { UpdateEventUseCase } from '../../application/use-cases/update-event.use-case';
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case';
import { CreateEventDto } from '../../application/dto/create-event.dto';
import { UpdateEventDto } from '../../application/dto/update-event.dto';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { EVENT_REPOSITORY } from '../../domain/interfaces/repository-tokens';
import { MinioService } from '../../infrastructure/external/minio.service';

/**
 * EventController
 * Handles HTTP requests for event management - Complete CRUD operations
 * Follows REST conventions and NestJS best practices
 * Requirements: 1.1, 1.3, 1.4
 */
@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly getAllEventsUseCase: GetAllEventsUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    private readonly minioService: MinioService,
  ) {}

  /**
   * POST /events
   * Creates a new event with ticket configurations and optional image
   * 
   * @param createEventDto - The event data to create
   * @param file - Optional image file for the event
   * @returns The created event with ID
   * @throws BadRequestException if input validation fails
   * 
   * Requirement 1.1: Persist event and return unique identifier
   * Requirement 1.2: Store ticket configuration with price and quantity
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Creates a new event with ticket configurations and an optional image'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Event name' },
        date: { type: 'string', format: 'date-time', description: 'Event date in ISO 8601 format' },
        location: { type: 'string', description: 'Event location' },
        ticketConfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['VIP', 'GENERAL', 'EARLY_BIRD'] },
              price: { type: 'number' },
              currency: { type: 'string' },
              quantity: { type: 'number' }
            }
          }
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Event image file (optional, jpg/png/gif)'
        }
      },
      required: ['name', 'date', 'location', 'ticketConfigurations']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event unique identifier' },
        name: { type: 'string', description: 'Event name' },
        date: { type: 'string', format: 'date-time', description: 'Event date and time' },
        location: { type: 'string', description: 'Event location' },
        imageUrl: { type: 'string', nullable: true, description: 'URL of the event image' },
        ticketConfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['VIP', 'GENERAL', 'EARLY_BIRD'], description: 'Ticket type' },
              price: { type: 'number', description: 'Ticket price' },
              currency: { type: 'string', description: 'Price currency' },
              totalQuantity: { type: 'number', description: 'Total tickets available' },
              availableQuantity: { type: 'number', description: 'Currently available tickets' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EventResponse> {
    try {
      // Convert ISO string to Date
      const eventDate = new Date(createEventDto.date);

      // Parse ticket configurations if it's a string (from form-data)
      const ticketConfigurations =
        typeof createEventDto.ticketConfigurations === 'string'
          ? JSON.parse(createEventDto.ticketConfigurations)
          : createEventDto.ticketConfigurations;

      // Upload image if provided
      let imageUrl: string | undefined;
      if (file) {
        // Validate file type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype)) {
          throw new Error('Only JPEG, PNG, and GIF images are allowed');
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image file size cannot exceed 5MB');
        }

        // Upload to MinIO
        imageUrl = await this.minioService.uploadFile(file);
      }

      // Execute use case
      const event = await this.createEventUseCase.execute({
        name: createEventDto.name,
        date: eventDate,
        location: createEventDto.location,
        imageUrl,
        ticketConfigurations,
      });

      // Return formatted response
      return this.formatEventResponse(event);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * PUT /events/:id
   * Updates an existing event
   * 
   * @param id - The event ID
   * @returns The event with all ticket configurations and availability
   * @throws NotFoundException if event does not exist
   * 
   * Requirement 1.3: Return event with all ticket types and current availability
   * Requirement 1.4: Return error with message "Evento no encontrado" if not found
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieves an event by its unique identifier with all ticket configurations and current availability'
  })
  @ApiParam({
    name: 'id',
    description: 'Event unique identifier',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Event found successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event unique identifier' },
        name: { type: 'string', description: 'Event name' },
        date: { type: 'string', format: 'date-time', description: 'Event date and time' },
        location: { type: 'string', description: 'Event location' },
        ticketConfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['VIP', 'GENERAL', 'EARLY_BIRD'], description: 'Ticket type' },
              price: { type: 'number', description: 'Ticket price' },
              currency: { type: 'string', description: 'Price currency' },
              totalQuantity: { type: 'number', description: 'Total tickets available' },
              availableQuantity: { type: 'number', description: 'Currently available tickets' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Event not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async findById(@Param('id') id: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.formatEventResponse(event);
  }

  /**
   * PUT /events/:id
   * Updates an existing event
   * 
   * @param id - The event ID
   * @param updateEventDto - The event data to update
   * @returns The updated event
   * @throws NotFoundException if event does not exist
   * @throws BadRequestException if input validation fails
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update event by ID',
    description: 'Updates an existing event with new data'
  })
  @ApiParam({
    name: 'id',
    description: 'Event unique identifier',
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateEventDto,
    description: 'Event update data'
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event unique identifier' },
        name: { type: 'string', description: 'Event name' },
        date: { type: 'string', format: 'date-time', description: 'Event date and time' },
        location: { type: 'string', description: 'Event location' },
        ticketConfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['VIP', 'GENERAL', 'EARLY_BIRD'], description: 'Ticket type' },
              price: { type: 'number', description: 'Ticket price' },
              currency: { type: 'string', description: 'Price currency' },
              totalQuantity: { type: 'number', description: 'Total tickets available' },
              availableQuantity: { type: 'number', description: 'Currently available tickets' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Validation failed' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Event not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto): Promise<EventResponse> {
    try {
      // Get existing event to merge with updates
      const existingEvent = await this.eventRepository.findById(id);
      if (!existingEvent) {
        throw new NotFoundException('Event not found');
      }

      // Merge existing data with updates
      const eventDate = updateEventDto.date ? new Date(updateEventDto.date) : existingEvent.date;
      const name = updateEventDto.name ?? existingEvent.name;
      const location = updateEventDto.location ?? existingEvent.location;
      const ticketConfigurations = updateEventDto.ticketConfigurations ?? 
        existingEvent.ticketConfigurations.map(config => ({
          type: config.type,
          price: config.price.amount,
          currency: config.price.currency,
          quantity: config.totalQuantity,
        }));

      // Execute use case
      const event = await this.updateEventUseCase.execute({
        id,
        name,
        date: eventDate,
        location,
        ticketConfigurations,
      });

      // Return formatted response
      return this.formatEventResponse(event);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message === 'Event not found') {
          throw new NotFoundException('Event not found');
        }
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /events/:id
   * Deletes an event
   * 
   * @param id - The event ID
   * @throws NotFoundException if event does not exist
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete event by ID',
    description: 'Deletes an existing event'
  })
  @ApiParam({
    name: 'id',
    description: 'Event unique identifier',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 204,
    description: 'Event deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Event not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async delete(@Param('id') id: string): Promise<void> {
    try {
      await this.deleteEventUseCase.execute(id);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Event not found') {
          throw new NotFoundException('Event not found');
        }
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * GET /events
   * Retrieves all events
   * 
   * @returns Array of all events with their ticket configurations
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all events',
    description: 'Retrieves all events with their ticket configurations and current availability'
  })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Event unique identifier' },
          name: { type: 'string', description: 'Event name' },
          date: { type: 'string', format: 'date-time', description: 'Event date and time' },
          location: { type: 'string', description: 'Event location' },
          ticketConfigurations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['VIP', 'GENERAL', 'EARLY_BIRD'], description: 'Ticket type' },
                price: { type: 'number', description: 'Ticket price' },
                currency: { type: 'string', description: 'Price currency' },
                totalQuantity: { type: 'number', description: 'Total tickets available' },
                availableQuantity: { type: 'number', description: 'Currently available tickets' }
              }
            }
          }
        }
      }
    }
  })
  async findAll(): Promise<EventResponse[]> {
    const events = await this.getAllEventsUseCase.execute();
    return events.map(event => this.formatEventResponse(event));
  }

  /**
   * Formats an Event entity into an HTTP response
   * 
   * @param event - The Event entity to format
   * @returns Formatted event response
   */
  private formatEventResponse(event: Event): EventResponse {
    return {
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      location: event.location,
      imageUrl: event.imageUrl || null,
      ticketConfigurations: event.ticketConfigurations.map(config => ({
        type: config.type,
        price: config.price.amount,
        currency: config.price.currency,
        totalQuantity: config.totalQuantity,
        availableQuantity: config.availableQuantity,
      })),
    };
  }
}

/**
 * EventResponse
 * HTTP response format for events
 */
interface EventResponse {
  id: string;
  name: string;
  date: string;
  location: string;
  imageUrl: string | null;
  ticketConfigurations: Array<{
    type: string;
    price: number;
    currency: string;
    totalQuantity: number;
    availableQuantity: number;
  }>;
}
