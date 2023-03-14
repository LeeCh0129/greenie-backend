import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async whoami(id: number): Promise<User> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .leftJoinAndSelect('user.post', 'post')
      .getOne();
  }

  async findOne(id: number): Promise<User> {
    return await this.userRepository.findOneBy({ id });
  }

  // async findOne(id: number): Promise<any> {
  //   return await this.userRepository
  //     .createQueryBuilder('user')
  //     .leftJoinAndSelect('user.posts', 'posts')
  //     .select(['user.id', 'posts.title', 'posts.body'])
  //     .getMany();
  // }
}
