import { IntersectionType } from '@nestjs/swagger';
import { EmailDto } from './email.dto';
import { PasswordDto } from './password.dto';

export class LoginDto extends IntersectionType(EmailDto, PasswordDto) {}
