import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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
      const webSG = new ec2.SecurityGroup(this, 'myvpc-webaccess',{
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
        
         /*Create a security groups and there rules*/
      const privateSG = new ec2.SecurityGroup(this, 'myvpc-private',{
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
        ec2.Port.allTcp()
        );
        
        
  }
}
