import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ReportStatus, DisputeStatus } from '@kiraka/contracts';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('reports')
  async listReports(
    @Query('status') status?: ReportStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.listReports(status, pageNum, limitNum);
  }

  @Put('reports/:id')
  async updateReportStatus(
    @Param('id') reportId: string,
    @Body('status') status: ReportStatus,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.updateReportStatus(reportId, status, notes);
  }

  @Get('disputes')
  async listDisputes(
    @Query('status') status?: DisputeStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.adminService.listDisputes(status, pageNum, limitNum);
  }

  @Post('disputes/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveDispute(
    @Param('id') disputeId: string,
    @CurrentUser('id') adminId: string,
    @Body('resolution') resolution: string,
    @Body('outcome') outcome?: DisputeStatus,
  ) {
    return this.adminService.resolveDispute(disputeId, adminId, resolution, outcome);
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @Param('id') userId: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.suspendUser(userId, adminId, reason);
  }

  @Post('users/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendUser(
    @Param('id') userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.unsuspendUser(userId, adminId);
  }

  @Get('users')
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.listUsers(pageNum, limitNum, search);
  }

  @Get('emails')
  async listEmailLogs(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getEmailLogs(limitNum);
  }

  @Get('emails/health')
  async getEmailHealth() {
    return this.adminService.getEmailHealth();
  }

  @Post('emails/send-test')
  @HttpCode(HttpStatus.OK)
  async sendTestEmail(@Body('to') to: string) {
    return this.adminService.sendTestEmail(to || 'Iamshemaleandre@gmail.com');
  }
}

