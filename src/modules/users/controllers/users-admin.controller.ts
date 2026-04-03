import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { Roles } from '@/modules/auth/decorators';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import {
  CreateUserDto,
  GetUserByIdParamsDto,
  GetUserByEmailParamsDto,
  GetUsersQueryDto,
  GetUsersResponseDto,
  UpdateUserDto,
  UserModelDto,
} from '../dto';
import type { GetUsersResponse, UserEntity } from '../interfaces';
import {
  UsersCreateService,
  UsersGetByEmailService,
  UsersGetByIdService,
  UsersListService,
  UsersUpdateService,
} from '../services';

/**
 * HTTP controller for admin-only users endpoints.
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersAdminController {
  constructor(
    private readonly _usersCreateService: UsersCreateService,
    private readonly _usersUpdateService: UsersUpdateService,
    private readonly _usersGetByEmailService: UsersGetByEmailService,
    private readonly _usersGetByIdService: UsersGetByIdService,
    private readonly _usersListService: UsersListService,
  ) {}

  /**
   * Creates a user and returns a sanitized payload.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(UserModelDto)
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserModelDto })
  async createUser(@Body() payload: CreateUserDto): Promise<UserEntity> {
    return this._usersCreateService.createUser(payload);
  }

  /**
   * Retrieves a user by email.
   */
  @Get('by-email/:email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UserModelDto)
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: HttpStatus.OK, type: UserModelDto })
  async getUserByEmail(@Param() params: GetUserByEmailParamsDto): Promise<UserEntity> {
    return this._usersGetByEmailService.getUserByEmail(params.email);
  }

  /**
   * Retrieves a user by id.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UserModelDto)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: HttpStatus.OK, type: UserModelDto })
  async getUserById(@Param() params: GetUserByIdParamsDto): Promise<UserEntity> {
    return this._usersGetByIdService.getUserById(params.id);
  }

  /**
   * Updates a user profile.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UserModelDto)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: HttpStatus.OK, type: UserModelDto })
  async updateUser(
    @Param() params: GetUserByIdParamsDto,
    @Body() payload: UpdateUserDto,
  ): Promise<UserEntity> {
    return this._usersUpdateService.updateUser(params.id, payload);
  }

  /**
   * Retrieves users list applying optional filters.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetUsersResponseDto)
  @ApiOperation({ summary: 'Get users' })
  @ApiResponse({ status: HttpStatus.OK, type: GetUsersResponseDto })
  async getUsers(@Query() payload: GetUsersQueryDto): Promise<GetUsersResponse> {
    return this._usersListService.getUsers(payload);
  }
}
