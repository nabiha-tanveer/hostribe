# Hostribe

**Split Expenses. Track Balances. Settle Fairly.**

Hostribe is a web based expense management application designed to make sharing expenses between friends and groups simple and organized.

Users can create groups, add shared expenses, split bills, track individual balances and record settlements in one place.

## Features

**User Authentication**

Register, login, logout and manage your profile securely.

**Group Management**

Create groups, manage members, update group details and invite people through email.

**Expense Management**

Add, edit and delete expenses with descriptions, amounts, dates and receipt attachments.

**Flexible Expense Splitting**

Split expenses equally or assign exact amounts to individual members.

**Balance Tracking**

Automatically calculate who owes money and who should receive money.

**Suggested Settlements**

Simplify group debts by calculating suggested payments between members.

**Settlement Management**

Record payments and keep track of completed settlements.

**Activity History**

View recent group activities and expense updates.

**Receipt Management**

Upload, view and manage expense receipts securely.

**CSV Export**

Export group expense records for offline reference.

**Password Reset**

Recover account access through the password reset functionality.

## Technologies Used

HTML5

CSS3

JavaScript

PHP

MySQL

Apache

## Project Structure

```text
Hostribe/
│
├── api/
├── config/
├── database/
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── index.html
│
└── storage/
```

## Installation

**1. Clone the repository**

```bash
git clone <repository-url>
cd Hostribe
```

**2. Configure the database**

Create a MySQL database and import the provided schema.

```bash
mysql -u root -p < database/schema.sql
```

**3. Configure the application**

Copy the example configuration file.

```bash
cp config/local.php.example config/local.php
```

Update the database credentials and application URL in `config/local.php`.

**4. Configure Apache**

Set the Apache document root to the project's `public` directory.

Enable Apache's `mod_rewrite` module and allow `.htaccess` overrides.

**5. Run the application**

Start Apache and MySQL, then open your configured application URL in a browser.

## Configuration

Email functionality can be configured through SMTP settings in `config/local.php`.

Receipt uploads are stored in the `storage/receipts/` directory.

Keep `config/local.php` private and never commit database credentials or other sensitive information.

## Payments

Hostribe records and tracks settlements between group members. Actual money transfers are handled directly between users. No online payment gateway is integrated.

## Purpose

Hostribe aims to simplify shared expense management by providing a convenient way to organize groups, manage expenses and maintain clear financial records.

