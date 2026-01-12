import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({
    summary: "Health check",
    description: "Returns the current health status of the application",
  })
  @ApiResponse({
    status: 200,
    description: "Application is healthy",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok", description: "Health status" },
        timestamp: {
          type: "string",
          format: "date-time",
          description: "Current timestamp",
        },
        uptime: {
          type: "number",
          description: "Application uptime in seconds",
        },
      },
    },
  })
  check(): HealthResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
