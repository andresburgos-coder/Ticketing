import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventDetailsTable1736371300000 implements MigrationInterface {
  name = "AddEventDetailsTable1736371300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "event_details" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "eventId" uuid NOT NULL,
            "category" character varying(100) NOT NULL,
            "minAge" integer,
            "seating" character varying(100),
            "capacity" integer,
            "foodSale" boolean NOT NULL DEFAULT false,
            "liquorSale" boolean NOT NULL DEFAULT false,
            "reducedMobilityAccess" boolean NOT NULL DEFAULT false,
            "pregnantAccess" boolean NOT NULL DEFAULT false,
            CONSTRAINT "PK_event_details_id" PRIMARY KEY ("id"),
            CONSTRAINT "FK_event_details_event" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_details"`);
  }
}
