-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Test` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `skill` ENUM('LISTENING', 'READING', 'WRITING', 'SPEAKING') NOT NULL,
    `examType` ENUM('ACADEMIC', 'GENERAL') NOT NULL DEFAULT 'ACADEMIC',
    `timeLimitMinutes` INTEGER NULL,
    `tags` JSON NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `practiceCount` INTEGER NOT NULL DEFAULT 0,
    `sourceFolder` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Test_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestSection` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `questionCount` INTEGER NOT NULL DEFAULT 0,
    `content` LONGTEXT NULL,
    `meta` JSON NULL,

    INDEX `TestSection_testId_idx`(`testId`),
    UNIQUE INDEX `TestSection_testId_order_key`(`testId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `number` INTEGER NOT NULL,
    `type` ENUM('GAP_FILL', 'MULTIPLE_CHOICE', 'TRUE_FALSE_NG', 'MATCHING', 'SHORT_ANSWER', 'TABLE_COMPLETION', 'MAP_LABELING', 'ESSAY', 'SPEAKING_PROMPT') NOT NULL,
    `content` JSON NOT NULL,
    `mediaUrl` VARCHAR(191) NULL,

    INDEX `Question_sectionId_idx`(`sectionId`),
    UNIQUE INDEX `Question_sectionId_order_key`(`sectionId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerKey` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `correctAnswer` JSON NOT NULL,
    `acceptableAnswers` JSON NULL,
    `explanation` TEXT NULL,

    UNIQUE INDEX `AnswerKey_questionId_key`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `testId` VARCHAR(191) NOT NULL,
    `mode` ENUM('PRACTICE', 'FULL') NOT NULL,
    `sectionIds` JSON NULL,
    `timeLimitMinutes` INTEGER NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `scoreRaw` INTEGER NULL,
    `scoreBand` DOUBLE NULL,

    INDEX `Attempt_testId_idx`(`testId`),
    INDEX `Attempt_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttemptAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `userAnswer` JSON NULL,
    `isCorrect` BOOLEAN NULL,

    UNIQUE INDEX `AttemptAnswer_attemptId_questionId_key`(`attemptId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaAsset` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `type` ENUM('AUDIO', 'IMAGE', 'OTHER') NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `duration` INTEGER NULL,
    `label` VARCHAR(191) NULL,

    INDEX `MediaAsset_testId_idx`(`testId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportJob` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `testId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PARSING', 'VALIDATED', 'FAILED', 'PERSISTED') NOT NULL DEFAULT 'PENDING',
    `sourceFiles` JSON NULL,
    `payload` JSON NULL,
    `errors` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ImportJob_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TestSection` ADD CONSTRAINT `TestSection_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `TestSection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerKey` ADD CONSTRAINT `AnswerKey_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attempt` ADD CONSTRAINT `Attempt_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttemptAnswer` ADD CONSTRAINT `AttemptAnswer_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `Attempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttemptAnswer` ADD CONSTRAINT `AttemptAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaAsset` ADD CONSTRAINT `MediaAsset_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportJob` ADD CONSTRAINT `ImportJob_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportJob` ADD CONSTRAINT `ImportJob_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default admin (password: change-me) — đổi mật khẩu sau khi login
INSERT INTO `User` (`id`, `email`, `username`, `passwordHash`, `role`, `createdAt`, `updatedAt`)
VALUES (
  'cmadminseed0001wewinielts',
  'admin@wewin.local',
  'admin',
  '$2b$10$5cJ3nHVFhCbNPiLyGL5K9uYQIUgTKG55qUja1mP0ovTz37YoQVGuu',
  'ADMIN',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `passwordHash` = VALUES(`passwordHash`),
  `role` = 'ADMIN',
  `username` = 'admin',
  `updatedAt` = NOW(3);
