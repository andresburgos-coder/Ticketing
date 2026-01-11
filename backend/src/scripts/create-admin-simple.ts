import { DataSource } from "typeorm";
import { UserOrmEntity } from "../infrastructure/persistence/entities/user.orm-entity";
import { UserRole } from "../domain/enums/user-role.enum";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

async function createAdminUser() {
  // Create database connection
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST ?? "localhost",
    port: parseInt(process.env.DATABASE_PORT ?? "5432", 10),
    username: process.env.DATABASE_USER ?? "ticket_user",
    password: process.env.DATABASE_PASSWORD ?? "ticket_pass",
    database: process.env.DATABASE_NAME ?? "ticket_sales",
    entities: [UserOrmEntity],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log("📡 Connected to database");

    const userRepository = dataSource.getRepository(UserOrmEntity);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: "admin@ticketapp.com" },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log(`Role: ${existingAdmin.role}`);
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("Admin123!", saltRounds);

    // Create admin user
    const adminUser = new UserOrmEntity();
    adminUser.id = uuidv4();
    adminUser.email = "admin@ticketapp.com";
    adminUser.passwordHash = passwordHash;
    adminUser.firstName = "Admin";
    adminUser.lastName = "User";
    adminUser.role = UserRole.ADMIN;
    adminUser.createdAt = new Date();

    const savedUser = await userRepository.save(adminUser);

    console.log("✅ Admin user created successfully:");
    console.log(`Email: ${savedUser.email}`);
    console.log(`Name: ${savedUser.firstName} ${savedUser.lastName}`);
    console.log(`Role: ${savedUser.role}`);
    console.log(`ID: ${savedUser.id}`);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error?.message || error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createAdminUser();
