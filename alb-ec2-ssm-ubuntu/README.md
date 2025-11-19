# Troubleshooting

WebSocket timeout issue
```
aws ssm start-session --target <instance-id> --region eu-west-1 --cli-read-timeout 30 --cli-connect-timeout 30
```

Instance info
```
aws ssm describe-instance-information --filters "Key=InstanceIds,Values=<instance-id>" --region eu-west-1

```

Starting Session

```
aws ssm start-session --target  <instance-id> --document-name AWS-StartPortForwardingSession --parameters "localPortNumber=22, portNumber=22" --region eu-west-1
```