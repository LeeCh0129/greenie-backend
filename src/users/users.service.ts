import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async findById(id: number): Promise<User> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .leftJoinAndSelect('user.post', 'post')
      .getOne();
  }

  async checkNicknameDuplicate(nickname: string) {
    if (!nickname) {
      throw new BadRequestException('닉네임을 입력해주세요.');
    }

    const user = await this.entityManager.exists(User, {
      where: {
        nickname: nickname,
      },
    });

    if (user) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    return { message: '사용가능한 닉네임입니다.' };
  }
}
