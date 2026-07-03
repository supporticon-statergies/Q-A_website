import json
import time
import boto3
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("Q-A_website")

headers = {
    "Access-Control-Allow-Origin": "https://supporticon-statergies.github.io/Q-A_website/",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json"
}

def lambda_handler(event, context):

    method = event["requestContext"]["http"]["method"]
    path = event["rawPath"]

    if method == "POST" and path == "/submit":
        return submit(event)

    if method == "GET" and path == "/attendees":
        return attendees()

    return {
        "statusCode": 404,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
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
                "headers": {
                    "Access-Control-Allow-Origin": "*"
                },
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
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "message": "Saved Successfully"
            })
        }

    except Exception as e:

        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
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
            raise TypeError

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            "body": json.dumps(
                items,
                default=decimal_default
            )
        }

    except Exception as e:

        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": str(e)
            })
        }