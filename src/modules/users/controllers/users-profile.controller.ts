import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { CurrentUser } from '@/modules/auth/decorators';
import { JwtAuthGuard, SelfGuard } from '@/modules/auth/guards';
import type { CurrentUser as CurrentUserPayload } from '@/modules/auth/interfaces';
import { GetUserByIdParamsDto, UpdatePasswordDto, UserModelDto } from '../dto';
import type { UserEntity } from '../interfaces';
import { UsersGetMeService, UsersUpdatePasswordService } from '../services';

/**
 * HTTP controller for authenticated users profile endpoints.
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersProfileController {
  constructor(
    private readonly _usersGetMeService: UsersGetMeService,
    private readonly _usersUpdatePasswordService: UsersUpdatePasswordService,
  ) {}

  /**
   * Retrieves the current authenticated user profile.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UserModelDto)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: HttpStatus.OK, type: UserModelDto })
  async getMe(@CurrentUser() currentUser: CurrentUserPayload): Promise<UserEntity> {
    return this._usersGetMeService.getMe(currentUser.id);
  }

  /**
   * Changes a user password validating the current password.
   */
  @Patch(':id/password')
  @UseGuards(JwtAuthGuard, SelfGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async updatePassword(
    @Param() params: GetUserByIdParamsDto,
    @Body() payload: UpdatePasswordDto,
  ): Promise<void> {
    await this._usersUpdatePasswordService.updatePassword(params.id, payload);
  }
}
