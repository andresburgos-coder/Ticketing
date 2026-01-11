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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AdminGuard } from "../guards/admin.guard";
import { AdminService } from "../../application/services/admin.service";
import { CreateAdminUserDto } from "../dtos/create-admin-user.dto";
import { UpdateUserDto } from "../dtos/update-user.dto";
import { GetUsersQueryDto } from "../dtos/get-users-query.dto";

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("users/admin")
  @ApiOperation({ summary: "Create admin user" })
  @ApiResponse({ status: 201, description: "Admin user created successfully" })
  @HttpCode(HttpStatus.CREATED)
  async createAdminUser(@Body() createAdminUserDto: CreateAdminUserDto) {
    return this.adminService.createAdminUser(createAdminUserDto);
  }

  @Get("users")
  @ApiOperation({ summary: "Get all users with pagination and filters" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get("users/:id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  async getUserById(@Param("id") id: string) {
    return this.adminService.getUserById(id);
  }

  @Put("users/:id")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete("users/:id")
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  async deleteUser(@Param("id") id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get("dashboard/stats")
  @ApiOperation({ summary: "Get dashboard statistics" })
  @ApiResponse({
    status: 200,
    description: "Dashboard stats retrieved successfully",
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get("events/stats")
  @ApiOperation({ summary: "Get events statistics" })
  @ApiResponse({
    status: 200,
    description: "Event stats retrieved successfully",
  })
  async getEventStats(@Query("eventId") eventId?: string) {
    return this.adminService.getEventStats(eventId);
  }

  @Get("tickets")
  @ApiOperation({ summary: "Get all tickets with filters" })
  @ApiResponse({ status: 200, description: "Tickets retrieved successfully" })
  async getTickets(
    @Query("eventId") eventId?: string,
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.adminService.getTickets({ eventId, status, page, limit });
  }

  @Get("tickets/stats")
  @ApiOperation({ summary: "Get ticket statistics" })
  @ApiResponse({
    status: 200,
    description: "Ticket stats retrieved successfully",
  })
  async getTicketStats(@Query("eventId") eventId?: string) {
    return this.adminService.getTicketStats(eventId);
  }

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
