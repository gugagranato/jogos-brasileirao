-- AlterTable
ALTER TABLE `Game` ADD COLUMN `isFinalized` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Player` ADD COLUMN `imageUrl` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `Prize` (
    `id` VARCHAR(191) NOT NULL,
    `championshipId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NULL,
    `value` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Prize` ADD CONSTRAINT `Prize_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `Championship`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
