-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: sentry_server
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `anlysisreult`
--

DROP TABLE IF EXISTS `anlysisreult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anlysisreult` (
  `anlysisReultId` bigint NOT NULL,
  `eventResultId` bigint NOT NULL,
  `anlysisReultcol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`anlysisReultId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `camerainfos`
--

DROP TABLE IF EXISTS `camerainfos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `camerainfos` (
  `cameraId` bigint NOT NULL AUTO_INCREMENT,
  `cameraName` varchar(45) NOT NULL,
  `cctvUrl` varchar(1024) NOT NULL,
  `coordx` double NOT NULL,
  `coordy` double NOT NULL,
  `isAnalisis` bit(1) NOT NULL,
  `analysisServerId` bigint DEFAULT NULL,
  `owner_user_id` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`cameraId`),
  KEY `fk_analysisServerId_idx` (`analysisServerId`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `eventresult`
--

DROP TABLE IF EXISTS `eventresult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventresult` (
  `eventResultId` bigint NOT NULL,
  `cameraId` bigint NOT NULL,
  `eventOccurTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `thumbnailPath` varchar(1024) NOT NULL,
  `serverId` bigint NOT NULL,
  `classId` bigint NOT NULL,
  PRIMARY KEY (`eventResultId`),
  KEY `fk_eventResult_cameraInfos_cameraId_idx` (`cameraId`),
  KEY `fk_eventResult_serverinfos_serverId_idx` (`serverId`),
  CONSTRAINT `fk_eventResult_camerainfos_cameraId` FOREIGN KEY (`cameraId`) REFERENCES `camerainfos` (`cameraId`),
  CONSTRAINT `fk_eventResult_serverinfos_serverId` FOREIGN KEY (`serverId`) REFERENCES `serverinfos` (`serverId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `serverinfos`
--

DROP TABLE IF EXISTS `serverinfos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serverinfos` (
  `serverId` bigint NOT NULL AUTO_INCREMENT,
  `serverIp` varchar(45) NOT NULL,
  `serverPort` bigint NOT NULL,
  `serverType` varchar(45) NOT NULL,
  `osId` varchar(45) DEFAULT NULL,
  `osPw` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`serverId`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'sentry_server'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-29 20:09:33
