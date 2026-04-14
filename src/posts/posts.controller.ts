import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { Prisma } from '../generated/prisma';

@ApiTags('Posts (Prisma)')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ─────────────────────────────────────────
  // GET /posts
  // ─────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les posts' })
  findAll() {
    return this.postsService.findAll();
  }

  // ─────────────────────────────────────────
  // GET /posts/:id
  // ─────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un post par ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  // ─────────────────────────────────────────
  // POST /posts
  // ─────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Créer un post' })
  create(@Body() data: Prisma.PostCreateInput) {
    return this.postsService.create(data);
  }

  // ─────────────────────────────────────────
  // PUT /posts/:id
  // ─────────────────────────────────────────
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un post' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Prisma.PostUpdateInput,
  ) {
    return this.postsService.update(id, data);
  }

  // ─────────────────────────────────────────
  // DELETE /posts/:id
  // ─────────────────────────────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un post' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }

  // ─────────────────────────────────────────
  // POST /posts/bulk
  // ─────────────────────────────────────────
  @Post('bulk')
  @ApiOperation({ summary: 'Créer plusieurs posts en une requête' })
  createMany(@Body() posts: Prisma.PostCreateManyInput[]) {
    return this.postsService.createMany(posts);
  }

  // ─────────────────────────────────────────
  // POST /posts/user-with-post
  // ─────────────────────────────────────────
  @Post('user-with-post')
  @ApiOperation({ summary: 'Créer un user ET un post (transaction)' })
  createUserWithPost(
    @Body() body: { email: string; firstName: string; postTitle: string },
  ) {
    return this.postsService.createUserWithPost(
      body.email,
      body.firstName,
      body.postTitle,
    );
  }
}
