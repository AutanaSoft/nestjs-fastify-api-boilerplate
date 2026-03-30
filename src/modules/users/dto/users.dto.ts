import { createZodDto } from 'nestjs-zod';
import {
  CreateUserInputSchema,
  GetUserByEmailInputSchema,
  GetUserByIdInputSchema,
  GetUsersQuerySchema,
  GetUsersResponseSchema,
  OperationResponseSchema,
  UpdatePasswordInputSchema,
  UpdateUserInputSchema,
  UserModelSchema,
} from '../schemas';

/**
 * Input DTO to create a user.
 */
export class CreateUserDto extends createZodDto(CreateUserInputSchema) {}

/**
 * Input DTO to update a user.
 */
export class UpdateUserDto extends createZodDto(UpdateUserInputSchema) {}

/**
 * Input DTO to change password.
 */
export class UpdatePasswordDto extends createZodDto(UpdatePasswordInputSchema) {}

/**
 * Param DTO to find user by email.
 */
export class GetUserByEmailParamsDto extends createZodDto(GetUserByEmailInputSchema) {}

/**
 * Param DTO to find user by id.
 */
export class GetUserByIdParamsDto extends createZodDto(GetUserByIdInputSchema) {}

/**
 * Query DTO to list users.
 */
export class GetUsersQueryDto extends createZodDto(GetUsersQuerySchema) {}

/**
 * Output DTO for simple operation responses.
 */
export class OperationResponseDto extends createZodDto(OperationResponseSchema) {}

/**
 * Output DTO for a sanitized user.
 */
export class UserModelDto extends createZodDto(UserModelSchema) {}

/**
 * Output DTO for users listing.
 */
export class GetUsersResponseDto extends createZodDto(GetUsersResponseSchema) {}
