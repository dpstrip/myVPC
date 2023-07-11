import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import {readFileSync} from 'fs';

export class MyVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

      const vpc = new ec2.Vpc(this, "davidsVPC",{
        vpcName: id,
          maxAzs: 1,
          natGateways: 0,
          ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
          subnetConfiguration: [
           {
            cidrMask: 24,
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED
           },
           {
            cidrMask: 24,
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC
           },
          ],
      });
      
      /*Create a security groups and there rules*/
      const webSG = new ec2.SecurityGroup(this, 'davidsmyvpc-webaccess',{
        vpc,
        allowAllOutbound: true,
        description: 'security group for public web access'
      });
      /* create security Group for it */
      webSG.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(22),
        'allow SSH access from anywhere');
        
      webSG.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'allow HTTP access from anywhere');
        
      webSG.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'allow HTTPS access from anywhere');  
        
         /*Create a security groups and there rules*/
      const privateSG = new ec2.SecurityGroup(this, 'davidsmyvpc-private',{
        vpc,
        allowAllOutbound: true,
        description: 'security group for private'
      });
      /* create security Group for it */
      privateSG.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(22),
        'allow SSH access from anywhere');
        
      privateSG.connections.allowFrom(
        new ec2.Connections({securityGroups:[webSG]}),
        ec2.Port.allIcmp()
        );
        
      /* Create a IAM role and a server to put into the public instance */
      
      //Create role
      const publicserverRole = new iam.Role(this, 'publicserver-role',
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies:[
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
          ],
      });
      
      //Add a EC2 instance
      const ec2PublicInstance = new ec2.Instance(this, 'my-ec2-instance', {
        vpc,
        vpcSubnets:{
          subnetType: ec2.SubnetType.PUBLIC,
        },
        role: publicserverRole,
        securityGroup: webSG,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE2,
          ec2.InstanceSize.MICRO
          ),
          machineImage: new ec2.AmazonLinuxImage({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,})
          });
          
          //load in a web server to test with
          const userDataScript = readFileSync('./lib/user-data.sh', 'utf8');
          ec2PublicInstance.addUserData(userDataScript);
      }
}
