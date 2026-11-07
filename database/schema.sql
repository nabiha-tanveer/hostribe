CREATE DATABASE IF NOT EXISTS hostribe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hostribe;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    default_currency VARCHAR(10) NOT NULL DEFAULT '',
    avatar_url VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_member (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    inviter_id INT NOT NULL,
    invitee_email VARCHAR(191) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    status ENUM('pending', 'accepted', 'ignored') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    INDEX idx_invitee_status (invitee_email, status),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    paid_by INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT '',
    expense_date DATE NOT NULL,
    split_type ENUM('EQUAL', 'EXACT') DEFAULT 'EQUAL',
    receipt_url TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expense_splits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    UNIQUE KEY unique_split (expense_id, user_id),
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    payer_id INT NOT NULL,
    payee_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT '',
    notes VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_user (user_id, expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
