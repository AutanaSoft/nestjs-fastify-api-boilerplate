import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { EmailSettingsResponseDto, UpdateEmailSettingsDto } from '../dto';
import { SettingsReadService, SettingsWriteService } from '../services';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly _settingsReadService: SettingsReadService,
    private readonly _settingsWriteService: SettingsWriteService,
  ) {}

  /**
   * Retrieves the system's registered email settings.
   * For security and convention, passwords are masked with ***.
   */
  @Get('email')
  @HttpCode(HttpStatus.OK)
  // We use the ResponseDto but tell ZodSerializer to allow the service's return type
  @ZodSerializerDto(EmailSettingsResponseDto)
  @ApiOperation({ summary: 'Get email settings' })
  @ApiResponse({ status: HttpStatus.OK, type: EmailSettingsResponseDto })
  async getEmailSettings(): Promise<EmailSettingsResponseDto> {
    const settings = await this._settingsReadService.getEmailSettings(true); // true = raw credentials masked
    return settings as EmailSettingsResponseDto;
  }

  /**
   * Updates email settings.
   * Preserves old passwords if the payload includes '***'.
   */
  @Patch('email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update email settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email settings updated successfully',
  })
  async updateEmailSettings(@Body() payload: UpdateEmailSettingsDto): Promise<void> {
    await this._settingsWriteService.updateEmailSettings(payload);
  }
}
