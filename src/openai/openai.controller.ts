import { Body, Controller, Post } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestOpenAIDto } from './dto/test-open-ai.dto';
import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  // test open ai
  @ApiOperation({
    summary: 'test open ai',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBearerAuth()
  @Post('')
  async testOpenAI(@Body() payload: TestOpenAIDto) {
    const response = await this.openaiService.generateResponse([
      {
        role: 'system',
        content: payload.message,
      },
    ]);
    return response;
  }
}
