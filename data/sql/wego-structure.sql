/*
 Navicat Premium Data Transfer

 Source Server         : _localhost
 Source Server Type    : MySQL
 Source Server Version : 80026
 Source Host           : 127.0.0.1:3306
 Source Schema         : wego

 Target Server Type    : MySQL
 Target Server Version : 80026
 File Encoding         : 65001

 Date: 10/10/2021 13:02:39
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for Asset
-- ----------------------------
DROP TABLE IF EXISTS `Asset`;
CREATE TABLE `Asset` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) DEFAULT NULL,
  `tokenId` varchar(512) NOT NULL,
  `owners` text,
  `description` longtext,
  `rariScore` int DEFAULT NULL,
  `contractAddress` varchar(512) NOT NULL,
  `owner` text,
  `animationUrl` varchar(512) DEFAULT NULL,
  `traits` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `slug` varchar(512) NOT NULL,
  `tokenMetadata` text,
  `imgBig` varchar(512) DEFAULT NULL,
  `imgSmall` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=135750 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for AssetTrait
-- ----------------------------
DROP TABLE IF EXISTS `AssetTrait`;
CREATE TABLE `AssetTrait` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contractAddress` varchar(42) DEFAULT NULL,
  `tokenId` varchar(512) DEFAULT NULL,
  `traitType` varchar(512) DEFAULT NULL,
  `value` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=702360 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for Collection
-- ----------------------------
DROP TABLE IF EXISTS `Collection`;
CREATE TABLE `Collection` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(512) DEFAULT NULL,
  `name` varchar(512) DEFAULT NULL,
  `floorPrice` float DEFAULT NULL,
  `wegoScore` float DEFAULT NULL,
  `releaseDate` datetime DEFAULT NULL,
  `released` tinyint(1) DEFAULT NULL,
  `contractAddress` varchar(512) DEFAULT NULL,
  `imgPortrait` varchar(512) DEFAULT NULL,
  `imgMain` varchar(512) DEFAULT NULL,
  `featuredCollection` tinyint(1) DEFAULT NULL,
  `totalSupply` float DEFAULT NULL,
  `osData` text,
  `oneDayVolume` float DEFAULT NULL,
  `oneDayChange` float DEFAULT NULL,
  `oneDaySales` float DEFAULT NULL,
  `oneDayAveragePrice` float DEFAULT NULL,
  `sevenDayVolume` float DEFAULT NULL,
  `sevenDayChange` float DEFAULT NULL,
  `sevenDaySales` float DEFAULT NULL,
  `sevenDayAveragePrice` float DEFAULT NULL,
  `thirtyDayVolume` float DEFAULT NULL,
  `thirtyDayChange` float DEFAULT NULL,
  `thirtyDaySales` float DEFAULT NULL,
  `thirtyDayAveragePrice` float DEFAULT NULL,
  `totalVolume` float DEFAULT NULL,
  `totalSales` float DEFAULT NULL,
  `count` float DEFAULT NULL,
  `numOwners` float DEFAULT NULL,
  `averagePrice` float DEFAULT NULL,
  `numReports` float DEFAULT NULL,
  `marketCap` float DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `featuredScore` int DEFAULT NULL,
  `description` text,
  `imgLarge` varchar(512) DEFAULT NULL,
  `tags` text,
  `twitter` varchar(40) DEFAULT NULL,
  `discord` varchar(40) DEFAULT NULL,
  `instagram` varchar(40) DEFAULT NULL,
  `telegram` varchar(40) DEFAULT NULL,
  `website` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58329 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for ContractAbi
-- ----------------------------
DROP TABLE IF EXISTS `ContractAbi`;
CREATE TABLE `ContractAbi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `abi` text,
  `isJSON` tinyint(1) DEFAULT NULL,
  `totalSupply` bigint DEFAULT NULL,
  `tokenUri` varchar(512) DEFAULT NULL,
  `abiMethod` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `address` (`address`)
) ENGINE=InnoDB AUTO_INCREMENT=18964 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for nft
-- ----------------------------
DROP TABLE IF EXISTS `nft`;
CREATE TABLE `nft` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) DEFAULT NULL,
  `contract` varchar(512) NOT NULL,
  `tokenId` int NOT NULL,
  `owners` text,
  `description` text,
  `imageBig` varchar(512) NOT NULL,
  `imageSmall` varchar(512) DEFAULT NULL,
  `properties` text,
  `rariscore` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table structure for Trait
-- ----------------------------
DROP TABLE IF EXISTS `Trait`;
CREATE TABLE `Trait` (
  `slug` varchar(512) NOT NULL,
  `traitType` varchar(100) NOT NULL,
  `value` varchar(100) NOT NULL,
  `displayType` varchar(512) DEFAULT NULL,
  `maxValue` varchar(512) DEFAULT NULL,
  `traitCount` int DEFAULT NULL,
  `order` int DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`slug`,`traitType`,`value`),
  UNIQUE KEY `productid_keyword_index` (`slug`,`traitType`,`value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
