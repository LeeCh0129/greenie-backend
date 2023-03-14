import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePostDto } from './dtos/create-post.dto';
import { PostsService } from './posts.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { User } from 'src/entities/user.entity';
import { CommentsService } from 'src/comments/comments.service';
import { FindCommentDTO } from 'src/comments/dtos/find-comment.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private commentsService: CommentsService,
  ) {}

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get('users')
  findAllWithUsers() {
    return this.postsService.findAllWithUsers();
  }

  @Get(':id/comments')
  findAllComments(@Param('id') postId: number, @Query() query: FindCommentDTO) {
    return this.commentsService.findAll(postId, query.page, query.take);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  likePost(@CurrentUser() user, @Param('id') postId: string) {
    return this.postsService.patchLike(user, parseInt(postId));
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@CurrentUser() user: User, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(
      user,
      createPostDto.title,
      createPostDto.body,
    );
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  createComment(
    @CurrentUser() user,
    @Body() createCommentDto: CreateCommentDto,
    @Param('id') postId: string,
  ) {
    return this.postsService.createComment(
      user,
      parseInt(postId),
      createCommentDto,
    );
  }
}
