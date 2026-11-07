<div align="center">
  <img src="public/images/logo.png" alt="Hostribe logo" width="112" />
  <h1>HOSTRIBE</h1>
  <p><strong>Shared expenses. Clear balances. Fair settlements.</strong></p>
  <p>A simple, organized way for friends and groups to manage shared money without the confusion.</p>
  <p>
    <img src="https://img.shields.io/badge/PHP-Backend-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP" />
    <img src="https://img.shields.io/badge/HTML5-Structure-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-Design-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=222222" alt="JavaScript" />
    <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/Apache-Web_Server-D22128?style=for-the-badge&logo=apache&logoColor=white" alt="Apache" />
  </p>
</div>

## About Hostribe

Hostribe is a group expense management application built to make shared spending easier to organize. Whether it is a trip, a shared apartment, a dinner, or everyday group expenses, members can record what was spent, decide how each cost is divided, and see exactly where everyone stands.

Instead of manually calculating who owes whom, Hostribe tracks expenses, calculates each member’s net balance, and suggests a simpler way to settle group debts.

## What You Can Do

<table>
  <tr>
    <td width="50%">
      <h3>Group Management</h3>
      Create groups, manage group details, add members, and keep each group’s expenses organized in one place.
    </td>
    <td width="50%">
      <h3>Email Invitations</h3>
      Invite people to a group by email. Recipients can accept or ignore pending invitations.
    </td>
  </tr>
  <tr>
    <td>
      <h3>Flexible Expense Splitting</h3>
      Record an expense and divide it equally or assign an exact share to each participant.
    </td>
    <td>
      <h3>Automatic Balance Calculation</h3>
      See how much each member paid, their share of the expenses, and their resulting net balance.
    </td>
  </tr>
  <tr>
    <td>
      <h3>Simplified Settlements</h3>
      Get suggested payments that reduce the number of transactions needed to settle group debts.
    </td>
    <td>
      <h3>Settlement Records</h3>
      Record payments made directly between group members and update the group’s balances.
    </td>
  </tr>
  <tr>
    <td>
      <h3>Receipt Attachments</h3>
      Attach receipts to expenses, preview supported files, and access them through protected receipt handling.
    </td>
    <td>
      <h3>Activity History</h3>
      Keep track of important group activity, including expense and membership updates.
    </td>
  </tr>
  <tr>
    <td>
      <h3>Account Management</h3>
      Create an account, sign in, manage account details, and reset a forgotten password.
    </td>
    <td>
      <h3>Group Overview</h3>
      Review group expenses, member balances, recent activity, and settlement suggestions from the application.
    </td>
  </tr>
</table>

## How It Works

<table>
  <tr>
    <th align="center">01</th>
    <th>Build Your Group</th>
  </tr>
  <tr>
    <td colspan="2">Create a group and invite the people who share expenses with you.</td>
  </tr>
  <tr>
    <th align="center">02</th>
    <th>Record an Expense</th>
  </tr>
  <tr>
    <td colspan="2">Add the amount, description, date, payer, participants, and an optional receipt.</td>
  </tr>
  <tr>
    <th align="center">03</th>
    <th>Choose How to Split</th>
  </tr>
  <tr>
    <td colspan="2">Use an equal split or enter exact amounts for individual members.</td>
  </tr>
  <tr>
    <th align="center">04</th>
    <th>Review the Balances</th>
  </tr>
  <tr>
    <td colspan="2">Hostribe calculates each member’s net position and suggests how the group can settle up.</td>
  </tr>
  <tr>
    <th align="center">05</th>
    <th>Record the Settlement</th>
  </tr>
  <tr>
    <td colspan="2">Members pay each other directly and record the settlement in Hostribe.</td>
  </tr>
</table>

## A Quick Example

Three friends share a group expense. Ali pays **Rs. 3,000**, Ahmed pays **Rs. 1,500**, and Hamza pays **Rs. 0**. The total is **Rs. 4,500**, so each person’s equal share is **Rs. 1,500**.

| Member | Amount paid | Equal share | Net position |
|:--|--:|--:|:--|
| Ali | Rs. 3,000 | Rs. 1,500 | Receives Rs. 1,500 |
| Ahmed | Rs. 1,500 | Rs. 1,500 | Settled |
| Hamza | Rs. 0 | Rs. 1,500 | Pays Rs. 1,500 |

Hostribe calculates these balances so the group does not have to work them out manually.

## Technology

| Layer | Technology | Responsibility |
|:--|:--|:--|
| Frontend structure | HTML5 | Page structure and application containers |
| Styling | CSS3 | Layout, visual design, and responsive behavior |
| Client side logic | Vanilla JavaScript | State, navigation, rendering, and API requests |
| Backend | PHP | Authentication, validation, business rules, and API endpoints |
| Database | MySQL | Users, groups, invitations, expenses, splits, settlements, and activity records |
| Web server | Apache | Serves the application and routes requests |

## Application Architecture

```text
Browser
  │
  ▼
HTML + CSS + JavaScript
  │
  │  HTTP requests and JSON responses
  ▼
Apache
  │
  ▼
PHP API
  │
  ├── Authentication
  ├── Password Reset
  ├── Groups and Invitations
  ├── Expenses and Receipt Uploads
  ├── Balance Calculations
  └── Settlements
  │
  ▼
MySQL Database
```

The frontend communicates with the PHP API. The API validates requests, applies the application rules, and reads or updates MySQL data. The JavaScript interface then renders the returned information.

## Project Structure

```text
Hostribe/
│
├── api/
│   ├── auth.php
│   ├── password_reset.php
│   ├── groups.php
│   ├── invites.php
│   ├── expenses.php
│   ├── balances.php
│   ├── settlements.php
│   └── index.php
│
├── config/
│   ├── config.php
│   ├── database.php
│   ├── session.php
│   └── local.php.example
│
├── database/
│   ├── schema.sql
│   └── migrations/
│
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── views.js
│   │   └── modals.js
│   ├── images/
│   ├── index.html
│   ├── api.php
│   └── receipt.php
│
└── storage/
    └── receipts/
```

## Getting Started

### Requirements

1. Apache with `mod_rewrite` enabled.
2. PHP with PDO and the MySQL PDO driver enabled.
3. MySQL.
4. Permission for the web server to write receipt files to the storage directory.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hostribe
```

### 2. Create the Database

The schema creates the `hostribe` database and its tables.

```bash
mysql -u root -p < database/schema.sql
```

### 3. Create the Local Configuration

```bash
cp config/local.php.example config/local.php
```

Open `config/local.php` and set your application URL and database credentials.

```php
'APP_URL' => 'http://hostribe.local',
'DB_HOST' => '127.0.0.1',
'DB_PORT' => '3306',
'DB_NAME' => 'hostribe',
'DB_USER' => 'your_database_user',
'DB_PASS' => 'your_database_password',
```

Configure SMTP settings in the same file if you want to use email delivery for invitations and password reset messages.

### 4. Configure Apache

Set the Apache document root to the project's `public` directory. Make sure `.htaccess` overrides are allowed for that directory.

Example VirtualHost configuration:

```apache
<VirtualHost *:80>
    ServerName hostribe.local
    DocumentRoot /absolute/path/to/Hostribe/public

    <Directory /absolute/path/to/Hostribe/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Enable URL rewriting on Ubuntu or Debian:

```bash
sudo a2enmod rewrite
sudo systemctl reload apache2
```

Add the local hostname to your system's hosts file:

```text
127.0.0.1 hostribe.local
```

Replace `/absolute/path/to/Hostribe` with the actual project path on your machine.

### 5. Set Receipt Storage Permissions

The web server needs write access to `storage/receipts/`. Give the Apache user appropriate ownership or permissions for your environment. Avoid making the directory world writable.

### 6. Open Hostribe

Visit the application URL configured in `config/local.php`:

```text
http://hostribe.local
```

## Database Overview

Hostribe stores its core application data in the following tables:

| Table | Purpose |
|:--|:--|
| `users` | User accounts and profile information |
| `groups` | Expense sharing groups |
| `group_members` | Membership relationships |
| `group_invitations` | Invitations and invitation status |
| `expenses` | Expense records |
| `expense_splits` | Each member’s share of an expense |
| `settlements` | Payments recorded between members |
| `activities` | Group activity history |
| `password_resets` | Password reset tokens and expiry information |

## Security Notes

1. Passwords are stored using PHP password hashing functions.
2. Database operations use PDO prepared statements.
3. Session identifiers are regenerated during authentication.
4. State changing API requests are protected with CSRF token validation.
5. Receipt access is handled through a PHP endpoint rather than exposing the storage directory directly.
6. Keep `config/local.php` private. Never commit database passwords, SMTP credentials, or other secrets.

## Payments

Hostribe records settlements between members. Actual money transfers happen directly between users. The application does not process payments through an online payment gateway.

## Project Goal

Hostribe is built around one simple idea: shared expenses should be easy to record, easy to understand, and fair for everyone involved.

<div align="center">
  <h3>HOSTRIBE</h3>
  <p><strong>Spend together. Stay clear. Settle fairly.</strong></p>
</div>
