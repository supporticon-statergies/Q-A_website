import json
import time
import boto3
from decimal import Decimal

# DynamoDB
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("Q-A_website")

# Common Headers
headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json"
}


def lambda_handler(event, context):

    print(json.dumps(event))

    method = event["requestContext"]["http"]["method"]
    path = event["rawPath"]

    print("METHOD:", method)
    print("PATH:", path)

    # Handle CORS Preflight
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }

    # POST /submit
    if method == "POST" and path == "/submit":
        return submit(event)

    # GET /attendees
    if method == "GET" and path == "/attendees":
        return attendees()

    return {
        "statusCode": 404,
        "headers": headers,
        "body": json.dumps({
            "message": "Route not found"
        })
    }


def submit(event):

    try:

        body = json.loads(event["body"])

        name = body.get("name")
        email = body.get("email")
        company = body.get("company", "")
        overall_score = body.get("overallScore", 0)
        areas_to_improve = body.get("areasToImprove", [])

        if not name or not email:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "message": "Name and Email are required"
                })
            }

        table.put_item(
            Item={
                "userEmail": email,
                "createdAt": int(time.time()),
                "name": name,
                "company": company,
                "overallScore": Decimal(str(overall_score)),
                "areasToImprove": areas_to_improve
            }
        )

        return {
            "statusCode": 201,
            "headers": headers,
            "body": json.dumps({
                "message": "Saved Successfully"
            })
        }

    except Exception as e:

        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({
                "error": str(e)
            })
        }


def attendees():

    try:

        response = table.scan()

        items = response.get("Items", [])

        items.sort(
            key=lambda x: x.get("createdAt", 0),
            reverse=True
        )

        def decimal_default(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            return obj

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(
                items,
                default=decimal_default
            )
        }

    except Exception as e:

        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({
                "error": str(e)
            })
        }