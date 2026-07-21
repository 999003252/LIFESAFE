# Team 6 Project

## Friends and messages

The backend creates the DynamoDB tables for profiles, friends, messages, and WebSocket connections when it starts. It reads AWS credentials and table settings from `backend/.env`.

Before using live messaging for the first time, run this once from the repository root:

```bash
python3 backend/setup_realtime.py
```

The script uses the existing `backend/.env`, deploys the AWS API Gateway WebSocket routes and Lambda handlers, then records the generated endpoint in that file. Start the backend normally afterward:

```bash
cd backend
python3 main.py
```

New accounts are copied into the backend user directory after registration, so they become searchable in Friends. The AWS credentials need CloudFormation, DynamoDB, Lambda, API Gateway, IAM, and S3 permissions for the one-time setup command.
