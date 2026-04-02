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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  CreateUserDto,
  GetUserByEmailParamsDto,
  GetUserByIdParamsDto,
  GetUsersQueryDto,
  GetUsersResponseDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserModelDto,
} from '../dto';
import type { UserEntity } from '../interfaces';
import {
  UsersCreateService,
  UsersGetByEmailService,
  UsersGetByIdService,
  UsersListService,
  UsersUpdatePasswordService,
  UsersUpdateService,
} from '../services';

/**
 * HTTP entry controller for users module operations.
 */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly _usersCreateService: UsersCreateService,
    private readonly _usersUpdateService: UsersUpdateService,
    private readonly _usersUpdatePasswordService: UsersUpdatePasswordService,
    private readonly _usersGetByEmailService: UsersGetByEmailService,
    private readonly _usersGetByIdService: UsersGetByIdService,
    private readonly _usersListService: UsersListService,
  ) {}

  /**
   * Creates a user and returns a sanitized payload.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(UserModelDto)
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserModelDto })
  async createUser(@Body() payload: CreateUserDto): Promise<UserEntity> {
    return this._usersCreateService.createUser(payload);
  }

  /**
   * Updates a user profile.
   */
  @Patch(':id')
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
   * Changes a user password validating the current password.
   */
  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async updatePassword(
    @Param() params: GetUserByIdParamsDto,
    @Body() payload: UpdatePasswordDto,
  ): Promise<void> {
    await this._usersUpdatePasswordService.updatePassword(params.id, payload);
  }

  /**
   * Retrieves a user by email.
   */
  @Get('by-email/:email')
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
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UserModelDto)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: HttpStatus.OK, type: UserModelDto })
  async getUserById(@Param() params: GetUserByIdParamsDto): Promise<UserEntity> {
    return this._usersGetByIdService.getUserById(params.id);
  }

  /**
   * Retrieves users list applying optional filters.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetUsersResponseDto)
  @ApiOperation({ summary: 'Get users' })
  @ApiResponse({ status: HttpStatus.OK, type: GetUsersResponseDto })
  async getUsers(@Query() payload: GetUsersQueryDto): Promise<GetUsersResponseDto> {
    return this._usersListService.getUsers(payload);
  }
}
