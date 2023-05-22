import { Controller, Get } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  // @Get('token')
  // async getAdminToken(): Promise<string> {
  // return this.authService.getAdminToken();
  // }
}
