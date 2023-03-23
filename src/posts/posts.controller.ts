import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { PaginationDto } from 'src/comments/dtos/find-comment.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private commentsService: CommentsService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.postsService.findAll(query.page, query.take);
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

  @Patch(':id')
  @UseGuards(AuthGuard)
  patchPost(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) postId: number,
    @Body() body: Partial<CreatePostDto>,
  ) {
    return this.postsService.update(postId, user, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  deletePost(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.delete(postId, user);
  }

  @Patch(':id/like')
  @UseGuards(AuthGuard)
  likePost(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.patchLike(user, postId);
  }

  @Get(':id/comments')
  findAllComments(@Param('id') postId: number, @Query() query: PaginationDto) {
    return this.commentsService.findAll(postId, query.page, query.take);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  createComment(
    @CurrentUser() user,
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      user,
      parseInt(postId),
      createCommentDto.content,
      createCommentDto.parentId,
      createCommentDto.replyToId,
    );
  }
}
