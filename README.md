# Foodiary API

## What I have learned so far

### Decorator design pattern

This design pattern allow us to abstract behavior and encapsulate it to be reused across the whole application.
In order to work with it, we need to install a dependency called `reflect-metadata` and we need to update some settings in the `tsconfig.json`. Since we are compiling the code with esbuild and it does not generate the internal metadata for us we need to add two more settings in the tsconfig, they are:

- experimentalDecorators
- emitDecoratorMetadata

Those settings make tsc generate the metadata to be used during the runtime

Disclaimer: by default, esbuild does not generate the metadata so since we are using it to compile the code we need to provide a custom settings that is gonna extend our tsconfig, check the file `esbuild.config.mjs`

### Working with dynamo db

Dynamo is excellent tool to work with serverless specially with aws lambdas. It provides a stateless connection using http protocol instead of UTP which is a persistent protocol (stateful). To Work with dynamo is important to have a good strategy and a well defined access pattern
so we can create the Global secondary indexes to get all the values we need with less queries as possible.

When working with dynamo we need to set up the correct permissions in order to run queries and mutation into the database.

Disclaimer: We need to set up a specific permission in the role just to run queries in the Global Secondary Indexes, only the default one with `dynamodb:Query` is not enough

### Cognito

Cognito is a AWS service that provides a full process of authorization and authentication for applications. In order to work with it, we need to define User Pool and a User Pool Client.

Cognito is also full integrated to other aws services, so if we have private routes for our web api, we can create a cognito authorizer that will act as a middleware as soon as as the api gateway receives a new request. The api gateway will not call the aws lambda directly, instead, it will call first the cognito authorizer to check if the credentials are available and valid before processing the request.

Cognito has a internal feature called triggers that allow us to define custom lambdas that would be called once an event specific event happens there.

Cognito has a limitation related to send emails. Cognito allow only 50 email messages sent daily per AWS Account in the default configuration. It's not viable to go to production with this limitation

In order to send this to production we need to move the SES service from sandbox to production (send an email to aws) and then we can set up a identity as a custom domain to send the emails or an email

### How to set up a custom domain for the api

    - Create a SSL certificate using ACM (AWS Certificate Manager)

        This service has no cost, it's totally free for public SSL certificates
        We need to validate the domain in the certificate. it's recommended to validate it using the DNS if it's hosted on Route 53

        Create a hosted zone on Route 53

        Create a template via cloud formation

        `sls/resources/ApiGWCustomDomain.yml`

        ```
            Resources:
                APIGWCustomDomainCertificate:
                    Type: AWS::CertificateManager::Certificate
                    Properties:
                        # This can be converted into an environment variable to set it based on the environment (dev, qa, prod, and etc...)
                        DomainName: api.foodiary.com.br
                        # Email / DNS / HTTP
                        ValidationMethod: DNS
                        DomainValidationOptions:
                            - DomainName: api.foodiary.com.br
                              # Hosted zone on Route 53
                              # This will make the ACM to locate the DNS and create the records automatically
                              HostedZoneId: <HOSTED_ZONE_ID>

        ```

        Attach this into the `serverless.yml`

    - Create a custom domain on API gateway

        `sls/resources/APIGWCustomDomain.yml`

        ```
            Resources:
                APIGWCustomDomain:
                    Type: AWS::ApiGatewayV2::DomainName
                    Properties:
                        DomainName: api.foodiary.com.br
                        # it can assume 3 values: API_MAPPING_ONLY, ROUTING_RULE_THEN_API_MAPPING and ROUTING_RULE_ONLY
                        RoutingMode: API_MAPPING_ONLY
                        DomainNameConfiguration:
                            - EndpointType: REGIONAL
                              IpAddress: ipv4
                              SecurityPolicy: TLS_1_2
                              CertificateArn: !Ref APIGWCustomDomainCertificate
        ```

    - Associate the API into the custom domain from API Gateway

        `sls/resources/APIGWCustomDomain.yml`

        ```
            Resources:
                APIGWCustomDomainApiMapping:
                    Type: AWS::ApiGatewayV2::ApiMapping
                    Properties:
                        # This is a service created internally by the serverless framework when we declare a lambda with a httpApi trigger
                        ApiId: !Ref HttpApi
                        DomainName: !Ref APIGWCustomDomain
                        Stage: $default

        ```


    - Create a new register on Route 53 to map the custom domain from API Gateway


        `sls/resources/APIGWCustomDomain.yml`

        ```
            Resources:
                APIGWCustomDomainDNSRecord:
                    Type: AWS::Route53::RecordSet
                    Properties:
                        Name: !Ref APIGWCustomDomain
                        Type: A
                        HostedZoneId: <HOSTED_ZONE_ID>
                        AliasTarget:
                            HostedZoneId: !GetAtt APIGWCustomDomain.RegionalHostedZoneId
                            DNSName: !GetAtt APIGWCustomDomain.RegionalDomainName
        ```

## Terms

- claims

The public payload we save into the JWT token

```
# Both ways will work

- !Join ["", [!GetAtt MainTable.Arn, "/index/*"]]
- !Sub "${MainTable.Arn}/index/*"
```

### Scripts

- Deploy

`sls deploy`

- Deploy function

`sls deploy function -f <function_name>`

- Check cloudwatch logs

`sls logs -f <function_name> -t`

`-t` means tail, the end of the logs
