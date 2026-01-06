import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
