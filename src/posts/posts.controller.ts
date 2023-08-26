import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnsupportedMediaTypeException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { CreatePostDto } from './dtos/create-post.dto';
import { PostsService } from './posts.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentsService } from 'src/comments/comments.service';
import { PaginationDto } from 'src/comments/dtos/find-comment.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { PayloadDto } from 'src/dtos/payload.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { PageDto } from 'src/dtos/page.dto';
import { PostResponseDto } from './dtos/post-response.dto';
import { CommentResponseDto } from './dtos/comment-response.dto';

@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('게시글')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private commentsService: CommentsService,
    private authService: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: '모든 게시글 조회' })
  @ApiResponse({
    status: 200,
    description: '게시글 조회 성공',
    type: PageDto,
  })
  findAll(@Query() query: PaginationDto) {
    return this.postsService.findAll(query.page, query.take);
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    const payload = await this.authService.verifyAccessToken(
      req.headers.authorization,
    );

    if (payload) {
      return this.postsService.findOne(postId, payload.id);
    }
    return this.postsService.findOne(postId, null);
  }

  @Get('user/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자가 작성한 게시글 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자가 작성한 게시글 조회 성공',
    type: PageDto,
  })
  findUserPosts(
    @CurrentUser() user: PayloadDto,
    @Query() query: PaginationDto,
  ) {
    const { page, take } = query;
    return this.postsService.findUserPosts(user.id, page, take);
  }

  @Get('user/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자가 작성한 댓글 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자가 작성한 댓글 조회 성공',
    type: PageDto,
  })
  findAllUserComments(
    @CurrentUser() user: PayloadDto,
    @Query() query: PaginationDto,
  ) {
    const { page, take } = query;
    return this.commentsService.findAllUserComments(user.id, page, take);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 생성 ' })
  @ApiResponse({
    status: 201,
    description: '게시글 생성 성공',
    type: PostResponseDto,
  })
  async create(
    @CurrentUser() user: PayloadDto,
    @Body() createPostDto: CreatePostDto,
  ): Promise<Object> {
    return await this.postsService.create(
      user.id,
      createPostDto.title,
      createPostDto.content,
      createPostDto.thumbnail,
    );
  }

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          const err = new UnsupportedMediaTypeException(
            '잘못된 이미지 타입입니다.',
          );
          return callback(err, false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: '게시글에 이미지 업로드' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: '이미지 업로드 성공',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '게시글 이미지',
    type: 'multipart/form-data',
    schema: {
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  postUpload(
    @UploadedFiles()
    images: Express.Multer.File[],
    @CurrentUser()
    user: PayloadDto,
  ) {
    return this.postsService.upload(images, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '게시글 수정',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '게시글 수정 성공',
    type: PostResponseDto,
  })
  @ApiBody({
    description: '수정할 게시글 내용',
    type: CreatePostDto,
  })
  patchPost(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
    @Body() body: Partial<CreatePostDto>,
  ) {
    return this.postsService.update(postId, user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '게시글 삭제 성공',
  })
  deletePost(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.delete(postId, user.id);
  }

  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '게시글 좋아요' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '게시글 좋아요 성공',
  })
  likePost(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.patchLike(user.id, postId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '게시글 댓글 조회' })
  @ApiResponse({
    status: 200,
    description: '게시글 댓글 조회 성공',
    type: CommentResponseDto,
    isArray: true,
  })
  findAllComments(
    @Param('id', ParseIntPipe) postId: number,
    @Query() query: PaginationDto,
  ) {
    return this.commentsService.findAll(postId, query.page, query.take);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '댓글 작성' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '댓글 작성 성공',
    type: CommentResponseDto,
  })
  @ApiBody({
    description: '작성할 댓글',
    type: CreateCommentDto,
  })
  createComment(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      user.id,
      postId,
      createCommentDto.content,
      createCommentDto.parentId,
      createCommentDto.replyToId,
    );
  }

  @Patch(':id/comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '댓글 좋아요' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '댓글 좋아요 성공',
  })
  likeComment(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return this.commentsService.patchLike(user.id, commentId);
  }
}
