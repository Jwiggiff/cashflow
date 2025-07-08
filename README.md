# CashFlow - Personal Finance Management

A modern, self-hosted personal finance management application built with Next.js, featuring bank account tracking, transaction management, and financial insights.

## Features

- 💰 **Bank Account Management** - Track multiple accounts (checking, savings, investment, credit)
- 📊 **Transaction Tracking** - Record income and expenses with categories
- 🔄 **Transfer Management** - Track money transfers between accounts
- 📈 **Financial Insights** - Visualize your spending patterns and trends
- 🔐 **Secure Authentication** - User accounts with secure login
- 🏷️ **Category Management** - Organize transactions with custom categories
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## How to Use

### Using Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
services:
  cashflow:
    container_name: cashflow
    image: ghcr.io/jwiggiff/cashflow:latest
    restart: unless-stopped
    volumes:
      - ./cashflow:/app/data
    ports:
      - "3000:3000"
    environment:
      # Generate a secure secret using `openssl rand -base64 33`
      - AUTH_SECRET=your-production-secret
      - BASE_URL=https://yourdomain.com
      # Optional - set your timezone
      # - TZ=America/New_York
      # Optional - This is used for auto-categorization of transactions
      # - OPENAI_API_KEY=your-openai-api-key
      # Optional - User and group IDs for file permissions (default: 1000)
      # - PUID=1000
      # - PGID=1000
    # Optional - Watchtower for automatic updates
    # labels:
    #   - "com.centurylinklabs.watchtower.enable=true"

  # Optional: Add Watchtower for automatic updates
  # watchtower:
  #   image: containrrr/watchtower:latest
  #   container_name: watchtower
  #   restart: unless-stopped
  #   environment:
  #     - WATCHTOWER_CLEANUP=true
  #     - WATCHTOWER_SCHEDULE=0 0 4 * * *  # Check for updates at 4 AM daily
  #     - WATCHTOWER_LABEL_ENABLE=true
  #   volumes:
  #     - /var/run/docker.sock:/var/run/docker.sock
```

Deploy:

```bash
docker compose up -d
```

## Configuration

### PUID and PGID

The container supports PUID (User ID) and PGID (Group ID) environment variables to run the application as a specific user, which is important for file permissions and security.

**Benefits:**
- Prevents the container from running as root
- Ensures proper file ownership for mounted volumes
- Follows Docker security best practices
- Allows fine-grained control over file permissions

**Finding Your User/Group ID:**
```bash
# Get your user ID
id -u

# Get your group ID
id -g
```

### Environment Variables

| Variable         | Description            | Default            |
| ---------------- | ---------------------- | ------------------ |
| `AUTH_SECRET`    | Secret for NextAuth.js | Required           |
| `BASE_URL`       | Your application URL   | Required           |
| `TZ`             | Timezone               | `America/New_York` |
| `OPENAI_API_KEY` | OpenAI API key         | `null`             |
| `PUID`           | User ID to run as      | `1000`             |
| `PGID`           | Group ID to run as     | `1000`             |

## API Usage

### POST /api/transactions

Create a transaction

#### Authentication

The API uses basic authentication using your username and password.

#### Request (JSON Body)

| Parameter        | Type                  | Description                                | Required                 |
| ---------------- | --------------------- | ------------------------------------------ | ------------------------ |
| `description`    | string                | The description of the transaction         | Yes                      |
| `amount`         | number                | The amount of the transaction              | Yes                      |
| `type`           | `INCOME` \| `EXPENSE` | The type of the transaction                | Yes                      |
| `date`           | string                | The date of the transaction                | No (defaults to today)   |
| `account`        | string                | The account name of the transaction        | Yes                      |
| `category`       | string                | The category of the transaction            | No                       |
| `autoCategorize` | boolean               | Whether to auto-categorize the transaction | No (defaults to `false`) |
| `source`         | string                | URL, email, or reference for the transaction | No                       |

##### Example Request

```json
{
  "description": "Metro",
  "amount": 100,
  "type": "EXPENSE",
  "date": "2021-01-01",
  "account": "Checking",
  "category": "Groceries",
  "autoCategorize": false,
  "source": "https://metro.com/receipt/123"
}
```

#### Response

| Parameter      | Type    | Description                                                       |
| -------------- | ------- | ----------------------------------------------------------------- |
| `success`      | boolean | Whether the transaction was created successfully                  |
| `data`         | object  | The transaction data if the transaction was created successfully  |
| `error`        | string  | The error message if the transaction was not created successfully |
| `errorDetails` | array   | The error details if the transaction was not created successfully |

##### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": 100,
    "date": "2021-01-01",
    "description": "Metro",
    "account": {
      "id": 1,
      "name": "Checking",
      "type": "CHECKING",
      "balance": 1000
    },
    "category": {
      "id": 1,
      "name": "Groceries"
    }
  }
}
```

## License

[MIT](https://opensource.org/licenses/MIT)

## Support

For issues and questions:

- Create an issue in the GitHub repository
