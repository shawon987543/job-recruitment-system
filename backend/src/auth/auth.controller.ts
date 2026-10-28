import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum'
import {
CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AllowFirstLogin } from '../common/decorators/allow-first-login.decorator';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

    @Post('Change-password')
    @AllowFirstLogin()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    ChangePassword(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: ChangePasswordDto,
    ){
        return this.authService.ChangePassword(user.userId, dto);
    }
    
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body() dto: RefreshTokenDto){
        return this.authService.refresh(dto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @AllowFirstLogin()
    @HttpCode(HttpStatus.OK)
    logout(@CurrentUser() user: AuthenticatedUser){
        return this.authService.logout(user.userId);
    }
    
    @Get('admin-check')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    adminCheck(@CurrentUser() user: AuthenticatedUser){
        return{
            message: 'Super Admin access granted',
            user,
        };
    }


  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      id: user.userId,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
  }
}