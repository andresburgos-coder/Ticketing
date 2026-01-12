import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminOrOrganizerGuard } from "../guards/admin-or-organizer.guard";
import { AdminService } from "../../application/services/admin.service";
import { CreateAdminUserDto } from "../dtos/create-admin-user.dto";
import { UpdateUserDto } from "../dtos/update-user.dto";
import { GetUsersQueryDto } from "../dtos/get-users-query.dto";

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Removed AdminGuard from controller level
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AdminGuard) // Admin-only endpoint
  @Post("users/admin")
  @ApiOperation({ summary: "Create admin user" })
  @ApiResponse({ status: 201, description: "Admin user created successfully" })
  @HttpCode(HttpStatus.CREATED)
  async createAdminUser(@Body() createAdminUserDto: CreateAdminUserDto) {
    return this.adminService.createAdminUser(createAdminUserDto);
  }

  @UseGuards(AdminGuard)
  @Get("users")
  @ApiOperation({ summary: "Get all users with pagination and filters" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @UseGuards(AdminGuard)
  @Get("users/:id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  async getUserById(@Param("id") id: string) {
    return this.adminService.getUserById(id);
  }

  @UseGuards(AdminGuard)
  @Put("users/:id")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @UseGuards(AdminGuard)
  @Delete("users/:id")
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  async deleteUser(@Param("id") id: string) {
    return this.adminService.deleteUser(id);
  }

  @UseGuards(AdminGuard)
  @Get("dashboard/stats")
  @ApiOperation({ summary: "Get dashboard statistics" })
  @ApiResponse({
    status: 200,
    description: "Dashboard stats retrieved successfully",
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @UseGuards(AdminOrOrganizerGuard)
  @Get("events/stats")
  @ApiOperation({ summary: "Get events statistics" })
  @ApiResponse({
    status: 200,
    description: "Event stats retrieved successfully",
  })
  async getEventStats(@Query("eventId") eventId?: string) {
    return this.adminService.getEventStats(eventId);
  }

  @UseGuards(AdminOrOrganizerGuard)
  @Get("tickets")
  @ApiOperation({ summary: "Get all tickets with filters (Admins: all events, Organizers: only their events)" })
  @ApiResponse({ status: 200, description: "Tickets retrieved successfully" })
  async getTickets(
    @Req() req: any,
    @Query("eventId") eventId?: string,
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.adminService.getTickets(
      { eventId, status, page, limit },
      req.user,
    );
  }

  @UseGuards(AdminOrOrganizerGuard)
  @Get("tickets/stats")
  @ApiOperation({ summary: "Get ticket statistics (Admins: all events, Organizers: only their events)" })
  @ApiResponse({
    status: 200,
    description: "Ticket stats retrieved successfully",
  })
  async getTicketStats(
    @Req() req: any,
    @Query("eventId") eventId?: string,
  ) {
    return this.adminService.getTicketStats(eventId, req.user);
  }

  @UseGuards(AdminGuard)
  @Get("reservations")
  @ApiOperation({ summary: "Get all reservations" })
  @ApiResponse({
    status: 200,
    description: "Reservations retrieved successfully",
  })
  async getReservations(
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.adminService.getReservations({ status, page, limit });
  }
}
