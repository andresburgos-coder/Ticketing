import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/interfaces/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { CreateAdminUserDto } from '../../presentation/dtos/create-admin-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(createAdminUserDto: CreateAdminUserDto): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, firstName, lastName, role } = createAdminUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user entity
    const user = new User(
      uuidv4(),
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      new Date(),
    );

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }
}