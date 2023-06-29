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
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';

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

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: PayloadDto,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(
      user.id,
      createPostDto.title,
      createPostDto.body,
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
  postUpload(
    @UploadedFiles()
    images: Express.Multer.File[],
    @CurrentUser()
    user: PayloadDto,
  ) {
    return this.postsService.upload(images, user.id);
  }

  @Patch('images')
  @UseGuards(JwtAuthGuard)
  patchUpload(@Body('imageUrls') imageUrls: string[]) {
    return this.postsService.copyToImage(imageUrls);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  patchPost(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
    @Body() body: Partial<CreatePostDto>,
  ) {
    return this.postsService.update(postId, user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePost(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.delete(postId, user.id);
  }

  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  likePost(
    @CurrentUser() user: PayloadDto,
    @Param('id', ParseIntPipe) postId: number,
  ) {
    return this.postsService.patchLike(user.id, postId);
  }

  @Get(':id/comments')
  findAllComments(
    @Param('id', ParseIntPipe) postId: number,
    @Query() query: PaginationDto,
  ) {
    return this.commentsService.findAll(postId, query.page, query.take);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
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
}
