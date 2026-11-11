import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CreateCategorySchema, type CreateCategoryInput } from '@kiraka/contracts';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(@Query('locale') locale?: string) {
    return this.categoriesService.getActiveCategories(locale);
  }

  @Get(':slug')
  async getCategory(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryBySlug(slug);
  }

  @Post()
  async createCategory(@Body(new ZodValidationPipe(CreateCategorySchema)) body: CreateCategoryInput) {
    return this.categoriesService.createCategory(body);
  }
}

