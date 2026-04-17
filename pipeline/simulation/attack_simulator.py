from typing import Dict, Any, List
import random
import time

class ScenarioLibrary:
    @staticmethod
    def get_scenarios() -> Dict[str, Dict[str, Any]]:
        return {
            # Initial Access Scenarios
            "phishing_to_exfiltration": {
                "steps": [
                    {"event_type": "phishing_click", "delay": 0},
                    {"event_type": "credential_theft", "delay": 60},
                    {"event_type": "brute_force", "delay": 120},
                    {"event_type": "successful_login", "delay": 180},
                    {"event_type": "lateral_movement", "delay": 300},
                    {"event_type": "data_exfiltration", "delay": 600},
                ],
                "description": "Phishing leads to credential compromise and data theft",
                "mitre_tactics": ["Initial Access", "Credential Access", "Lateral Movement", "Exfiltration"],
                "mitre_techniques": ["T1566", "T1110", "T1021", "T1041"]
            },
            "spear_phishing_attachment": {
                "steps": [
                    {"event_type": "phishing_email", "delay": 0},
                    {"event_type": "malware_delivery", "delay": 30},
                    {"event_type": "malware_execution", "delay": 60},
                    {"event_type": "persistence_established", "delay": 90},
                    {"event_type": "c2_beacon", "delay": 120, "repeat": 5},
                    {"event_type": "data_collection", "delay": 300},
                ],
                "description": "Spear phishing with malicious attachment",
                "mitre_tactics": ["Initial Access", "Execution", "Persistence", "Command and Control"],
                "mitre_techniques": ["T1566", "T1204", "T1547", "T1071"]
            },
            "watering_hole_attack": {
                "steps": [
                    {"event_type": "drive_by_compromise", "delay": 0},
                    {"event_type": "exploit_public_facing_app", "delay": 15},
                    {"event_type": "web_shell_deployment", "delay": 45},
                    {"event_type": "command_execution", "delay": 75},
                    {"event_type": "lateral_movement", "delay": 120},
                ],
                "description": "Watering hole compromise of legitimate website",
                "mitre_tactics": ["Initial Access", "Execution", "Lateral Movement"],
                "mitre_techniques": ["T1189", "T1204", "T1505", "T1021"]
            },
            "supply_chain_compromise": {
                "steps": [
                    {"event_type": "supply_chain_attack", "delay": 0},
                    {"event_type": "malware_infection", "delay": 30},
                    {"event_type": "persistence_established", "delay": 60},
                    {"event_type": "c2_beacon", "delay": 90, "repeat": 3},
                    {"event_type": "data_exfiltration", "delay": 180},
                ],
                "description": "Third-party software supply chain compromise",
                "mitre_tactics": ["Initial Access", "Execution", "Persistence", "Exfiltration"],
                "mitre_techniques": ["T1195", "T1204", "T1547", "T1041"]
            },

            # Execution Scenarios
            "powershell_empire": {
                "steps": [
                    {"event_type": "powershell_execution", "delay": 0},
                    {"event_type": "script_execution", "delay": 15},
                    {"event_type": "command_execution", "delay": 30},
                    {"event_type": "module_loading", "delay": 45},
                    {"event_type": "c2_communication", "delay": 60, "repeat": 4},
                ],
                "description": "PowerShell Empire post-exploitation framework",
                "mitre_tactics": ["Execution", "Command and Control"],
                "mitre_techniques": ["T1059", "T1543", "T1071"]
            },
            "scheduled_task_execution": {
                "steps": [
                    {"event_type": "scheduled_task_creation", "delay": 0},
                    {"event_type": "script_execution", "delay": 30},
                    {"event_type": "command_execution", "delay": 60},
                    {"event_type": "data_collection", "delay": 120},
                    {"event_type": "data_exfiltration", "delay": 180},
                ],
                "description": "Malicious scheduled task execution",
                "mitre_tactics": ["Execution", "Persistence", "Collection"],
                "mitre_techniques": ["T1053", "T1059", "T1115"]
            },
            "user_execution_malicious_file": {
                "steps": [
                    {"event_type": "malicious_file_download", "delay": 0},
                    {"event_type": "user_execution", "delay": 45},
                    {"event_type": "malware_execution", "delay": 60},
                    {"event_type": "persistence_established", "delay": 90},
                    {"event_type": "c2_beacon", "delay": 120, "repeat": 3},
                ],
                "description": "User execution of malicious file",
                "mitre_tactics": ["Execution", "Persistence", "Command and Control"],
                "mitre_techniques": ["T1204", "T1547", "T1071"]
            },

            # Persistence Scenarios
            "registry_run_key": {
                "steps": [
                    {"event_type": "registry_modification", "delay": 0},
                    {"event_type": "autorun_registry", "delay": 30},
                    {"event_type": "system_reboot", "delay": 60},
                    {"event_type": "malware_execution", "delay": 90},
                    {"event_type": "c2_beacon", "delay": 120, "repeat": 2},
                ],
                "description": "Registry Run key persistence",
                "mitre_tactics": ["Persistence", "Execution"],
                "mitre_techniques": ["T1547", "T1112", "T1059"]
            },
            "service_creation": {
                "steps": [
                    {"event_type": "service_creation", "delay": 0},
                    {"event_type": "service_modification", "delay": 30},
                    {"event_type": "system_reboot", "delay": 60},
                    {"event_type": "malware_execution", "delay": 90},
                    {"event_type": "command_execution", "delay": 120},
                ],
                "description": "Malicious service creation for persistence",
                "mitre_tactics": ["Persistence", "Execution"],
                "mitre_techniques": ["T1543", "T1031", "T1059"]
            },
            "startup_folder": {
                "steps": [
                    {"event_type": "startup_folder_modification", "delay": 0},
                    {"event_type": "system_reboot", "delay": 45},
                    {"event_type": "malware_execution", "delay": 60},
                    {"event_type": "persistence_established", "delay": 75},
                    {"event_type": "c2_beacon", "delay": 90, "repeat": 2},
                ],
                "description": "Startup folder persistence mechanism",
                "mitre_tactics": ["Persistence", "Execution"],
                "mitre_techniques": ["T1547", "T1204", "T1071"]
            },

            # Privilege Escalation Scenarios
            "uac_bypass": {
                "steps": [
                    {"event_type": "uac_bypass_attempt", "delay": 0},
                    {"event_type": "privilege_escalation", "delay": 15},
                    {"event_type": "admin_privileges", "delay": 30},
                    {"event_type": "system_access", "delay": 45},
                    {"event_type": "data_collection", "delay": 75},
                ],
                "description": "UAC bypass for privilege escalation",
                "mitre_tactics": ["Privilege Escalation", "Discovery"],
                "mitre_techniques": ["T1548", "T1082", "T1115"]
            },
            "exploit_vulnerability": {
                "steps": [
                    {"event_type": "vulnerability_scan", "delay": 0},
                    {"event_type": "exploit_attempt", "delay": 30},
                    {"event_type": "privilege_escalation", "delay": 45},
                    {"event_type": "system_compromise", "delay": 60},
                    {"event_type": "lateral_movement", "delay": 90},
                ],
                "description": "Local exploit for privilege escalation",
                "mitre_tactics": ["Privilege Escalation", "Lateral Movement"],
                "mitre_techniques": ["T1068", "T1210", "T1021"]
            },
            "dll_hijacking": {
                "steps": [
                    {"event_type": "dll_placement", "delay": 0},
                    {"event_type": "dll_hijacking", "delay": 30},
                    {"event_type": "privilege_escalation", "delay": 45},
                    {"event_type": "system_access", "delay": 60},
                    {"event_type": "command_execution", "delay": 90},
                ],
                "description": "DLL search order hijacking",
                "mitre_tactics": ["Privilege Escalation", "Execution"],
                "mitre_techniques": ["T1574", "T1059", "T1548"]
            },

            # Defense Evasion Scenarios
            "process_injection": {
                "steps": [
                    {"event_type": "process_injection", "delay": 0},
                    {"event_type": "memory_manipulation", "delay": 15},
                    {"event_type": "code_execution", "delay": 30},
                    {"event_type": "anti_analysis", "delay": 45},
                    {"event_type": "c2_communication", "delay": 60, "repeat": 3},
                ],
                "description": "Process injection for defense evasion",
                "mitre_tactics": ["Defense Evasion", "Execution"],
                "mitre_techniques": ["T1055", "T1027", "T1071"]
            },
            "obfuscated_files": {
                "steps": [
                    {"event_type": "file_obfuscation", "delay": 0},
                    {"event_type": "encoded_payload", "delay": 15},
                    {"event_type": "script_execution", "delay": 30},
                    {"event_type": "payload_decoding", "delay": 45},
                    {"event_type": "malware_execution", "delay": 60},
                ],
                "description": "Obfuscated files or information",
                "mitre_tactics": ["Defense Evasion", "Execution"],
                "mitre_techniques": ["T1027", "T1059", "T1204"]
            },
            "disable_security_tools": {
                "steps": [
                    {"event_type": "security_tool_discovery", "delay": 0},
                    {"event_type": "tool_disable_attempt", "delay": 15},
                    {"event_type": "antivirus_disable", "delay": 30},
                    {"event_type": "firewall_disable", "delay": 45},
                    {"event_type": "data_exfiltration", "delay": 75},
                ],
                "description": "Disable or modify tools",
                "mitre_tactics": ["Defense Evasion", "Discovery"],
                "mitre_techniques": ["T1562", "T1082", "T1041"]
            },

            # Credential Access Scenarios
            "credential_dumping": {
                "steps": [
                    {"event_type": "credential_access_attempt", "delay": 0},
                    {"event_type": "lsass_dump", "delay": 30},
                    {"event_type": "password_dump", "delay": 45},
                    {"event_type": "credential_theft", "delay": 60},
                    {"event_type": "lateral_movement", "delay": 90},
                ],
                "description": "LSASS memory credential dumping",
                "mitre_tactics": ["Credential Access", "Lateral Movement"],
                "mitre_techniques": ["T1003", "T1021", "T1555"]
            },
            "brute_force_attack": {
                "steps": [
                    {"event_type": "brute_force", "delay": 0, "repeat": 5},
                    {"event_type": "account_lockout", "delay": 30},
                    {"event_type": "password_spray", "delay": 60},
                    {"event_type": "successful_login", "delay": 90},
                    {"event_type": "privilege_escalation", "delay": 120},
                ],
                "description": "Brute force password cracking",
                "mitre_tactics": ["Credential Access", "Privilege Escalation"],
                "mitre_techniques": ["T1110", "T1548", "T1078"]
            },
            "kerberoasting": {
                "steps": [
                    {"event_type": "kerberos_ticket_request", "delay": 0},
                    {"event_type": "service_ticket_extraction", "delay": 30},
                    {"event_type": "offline_cracking", "delay": 60},
                    {"event_type": "credential_theft", "delay": 90},
                    {"event_type": "lateral_movement", "delay": 120},
                ],
                "description": "Kerberoasting attack",
                "mitre_tactics": ["Credential Access", "Lateral Movement"],
                "mitre_techniques": ["T1558", "T1021", "T1003"]
            },

            # Discovery Scenarios
            "network_discovery": {
                "steps": [
                    {"event_type": "network_scan", "delay": 0},
                    {"event_type": "port_scan", "delay": 15},
                    {"event_type": "service_enumeration", "delay": 30},
                    {"event_type": "host_discovery", "delay": 45},
                    {"event_type": "vulnerability_scan", "delay": 60},
                ],
                "description": "Network service scanning",
                "mitre_tactics": ["Discovery", "Reconnaissance"],
                "mitre_techniques": ["T1046", "T1018", "T1049"]
            },
            "system_information_discovery": {
                "steps": [
                    {"event_type": "system_info_gathering", "delay": 0},
                    {"event_type": "os_discovery", "delay": 15},
                    {"event_type": "software_discovery", "delay": 30},
                    {"event_type": "user_account_discovery", "delay": 45},
                    {"event_type": "permission_discovery", "delay": 60},
                ],
                "description": "System information discovery",
                "mitre_tactics": ["Discovery"],
                "mitre_techniques": ["T1082", "T1016", "T1033"]
            },
            "file_system_discovery": {
                "steps": [
                    {"event_type": "file_system_enumeration", "delay": 0},
                    {"event_type": "directory_listing", "delay": 15},
                    {"event_type": "file_search", "delay": 30},
                    {"event_type": "sensitive_file_access", "delay": 45},
                    {"event_type": "data_collection", "delay": 60},
                ],
                "description": "File and directory discovery",
                "mitre_tactics": ["Discovery", "Collection"],
                "mitre_techniques": ["T1083", "T1115", "T1005"]
            },

            # Lateral Movement Scenarios
            "ps_remote_execution": {
                "steps": [
                    {"event_type": "remote_service_creation", "delay": 0},
                    {"event_type": "powershell_remote", "delay": 30},
                    {"event_type": "command_execution", "delay": 45},
                    {"event_type": "data_collection", "delay": 75},
                    {"event_type": "lateral_movement", "delay": 90},
                ],
                "description": "PowerShell remote execution",
                "mitre_tactics": ["Lateral Movement", "Execution"],
                "mitre_techniques": ["T1021", "T1059", "T1005"]
            },
            "rdp_session_hijacking": {
                "steps": [
                    {"event_type": "rdp_connection", "delay": 0},
                    {"event_type": "session_hijacking", "delay": 30},
                    {"event_type": "credential_theft", "delay": 45},
                    {"event_type": "lateral_movement", "delay": 60},
                    {"event_type": "data_exfiltration", "delay": 90},
                ],
                "description": "RDP session hijacking",
                "mitre_tactics": ["Lateral Movement", "Credential Access"],
                "mitre_techniques": ["T1021", "T1563", "T1041"]
            },
            "smb_relay_attack": {
                "steps": [
                    {"event_type": "smb_connection", "delay": 0},
                    {"event_type": "ntlm_relay", "delay": 30},
                    {"event_type": "credential_theft", "delay": 45},
                    {"event_type": "lateral_movement", "delay": 60},
                    {"event_type": "domain_admin_access", "delay": 90},
                ],
                "description": "SMB relay attack",
                "mitre_tactics": ["Lateral Movement", "Credential Access"],
                "mitre_techniques": ["T1021", "T1557", "T1078"]
            },

            # Collection Scenarios
            "data_from_local_system": {
                "steps": [
                    {"event_type": "file_access", "delay": 0},
                    {"event_type": "data_collection", "delay": 30},
                    {"event_type": "clipboard_data", "delay": 45},
                    {"event_type": "browser_data", "delay": 60},
                    {"event_type": "data_staging", "delay": 90},
                ],
                "description": "Data from local system",
                "mitre_tactics": ["Collection"],
                "mitre_techniques": ["T1005", "T1115", "T1113"]
            },
            "email_collection": {
                "steps": [
                    {"event_type": "email_access", "delay": 0},
                    {"event_type": "email_search", "delay": 30},
                    {"event_type": "email_download", "delay": 45},
                    {"event_type": "data_staging", "delay": 60},
                    {"event_type": "data_exfiltration", "delay": 90},
                ],
                "description": "Email collection",
                "mitre_tactics": ["Collection", "Exfiltration"],
                "mitre_techniques": ["T1114", "T1041", "T1074"]
            },
            "screen_capture": {
                "steps": [
                    {"event_type": "screen_capture", "delay": 0},
                    {"event_type": "keylogger_deployment", "delay": 30},
                    {"event_type": "input_capture", "delay": 45},
                    {"event_type": "data_collection", "delay": 60},
                    {"event_type": "data_exfiltration", "delay": 90},
                ],
                "description": "Screen capture and input capture",
                "mitre_tactics": ["Collection", "Exfiltration"],
                "mitre_techniques": ["T1113", "T1056", "T1041"]
            },

            # Command and Control Scenarios
            "c2_beaconing": {
                "steps": [
                    {"event_type": "malware_infection", "delay": 0},
                    {"event_type": "c2_beacon", "delay": 45, "repeat": 10},
                    {"event_type": "command_execution", "delay": 90},
                    {"event_type": "privilege_escalation", "delay": 120},
                    {"event_type": "data_exfiltration", "delay": 180},
                ],
                "description": "C2 beaconing with command execution and data theft",
                "mitre_tactics": ["Command and Control", "Execution", "Exfiltration"],
                "mitre_techniques": ["T1071", "T1059", "T1041"]
            },
            "dns_tunneling": {
                "steps": [
                    {"event_type": "dns_query", "delay": 0, "repeat": 8},
                    {"event_type": "data_encoding", "delay": 30},
                    {"event_type": "c2_communication", "delay": 45, "repeat": 6},
                    {"event_type": "command_receipt", "delay": 75},
                    {"event_type": "data_exfiltration", "delay": 105},
                ],
                "description": "DNS tunneling for C2",
                "mitre_tactics": ["Command and Control", "Exfiltration"],
                "mitre_techniques": ["T1071", "T1041", "T1132"]
            },
            "web_service_c2": {
                "steps": [
                    {"event_type": "http_request", "delay": 0, "repeat": 5},
                    {"event_type": "web_service_communication", "delay": 30},
                    {"event_type": "command_execution", "delay": 60},
                    {"event_type": "data_upload", "delay": 90},
                    {"event_type": "data_exfiltration", "delay": 120},
                ],
                "description": "Web service C2 communication",
                "mitre_tactics": ["Command and Control", "Exfiltration"],
                "mitre_techniques": ["T1071", "T1041", "T1102"]
            },

            # Exfiltration Scenarios
            "data_exfiltration_over_c2": {
                "steps": [
                    {"event_type": "data_collection", "delay": 0},
                    {"event_type": "data_compression", "delay": 30},
                    {"event_type": "data_encryption", "delay": 45},
                    {"event_type": "c2_exfiltration", "delay": 60},
                    {"event_type": "cleanup", "delay": 90},
                ],
                "description": "Exfiltration over C2 channel",
                "mitre_tactics": ["Exfiltration"],
                "mitre_techniques": ["T1041", "T1020", "T1070"]
            },
            "ftp_exfiltration": {
                "steps": [
                    {"event_type": "ftp_connection", "delay": 0},
                    {"event_type": "data_upload", "delay": 30},
                    {"event_type": "file_transfer", "delay": 45, "repeat": 3},
                    {"event_type": "connection_cleanup", "delay": 90},
                    {"event_type": "log_deletion", "delay": 105},
                ],
                "description": "FTP data exfiltration",
                "mitre_tactics": ["Exfiltration"],
                "mitre_techniques": ["T1048", "T1070", "T1105"]
            },
            "cloud_storage_exfil": {
                "steps": [
                    {"event_type": "cloud_service_auth", "delay": 0},
                    {"event_type": "data_upload", "delay": 30},
                    {"event_type": "file_sync", "delay": 45},
                    {"event_type": "data_exfiltration", "delay": 60},
                    {"event_type": "account_cleanup", "delay": 90},
                ],
                "description": "Exfiltration to cloud storage",
                "mitre_tactics": ["Exfiltration"],
                "mitre_techniques": ["T1567", "T1102", "T1070"]
            },

            # Impact Scenarios
            "ransomware_deployment": {
                "steps": [
                    {"event_type": "ransomware_execution", "delay": 0},
                    {"event_type": "file_encryption", "delay": 30, "repeat": 5},
                    {"event_type": "ransom_note", "delay": 90},
                    {"event_type": "system_shutdown", "delay": 120},
                    {"event_type": "data_destruction", "delay": 150},
                ],
                "description": "Ransomware deployment and execution",
                "mitre_tactics": ["Impact"],
                "mitre_techniques": ["T1486", "T1490", "T1529"]
            },
            "data_destruction": {
                "steps": [
                    {"event_type": "data_identification", "delay": 0},
                    {"event_type": "file_deletion", "delay": 30, "repeat": 4},
                    {"event_type": "disk_wiping", "delay": 90},
                    {"event_type": "system_damage", "delay": 120},
                    {"event_type": "evidence_destruction", "delay": 150},
                ],
                "description": "Data destruction and disk wiping",
                "mitre_tactics": ["Impact"],
                "mitre_techniques": ["T1485", "T1561", "T1070"]
            },
            "service_denial": {
                "steps": [
                    {"event_type": "service_stop", "delay": 0},
                    {"event_type": "process_termination", "delay": 15},
                    {"event_type": "resource_exhaustion", "delay": 30},
                    {"event_type": "system_crash", "delay": 60},
                    {"event_type": "service_disruption", "delay": 90},
                ],
                "description": "Service stop and system disruption",
                "mitre_tactics": ["Impact"],
                "mitre_techniques": ["T1489", "T1499", "T1529"]
            },

            # Additional Advanced Scenarios
            "zero_day_exploit": {
                "steps": [
                    {"event_type": "zero_day_discovery", "delay": 0},
                    {"event_type": "exploit_development", "delay": 30},
                    {"event_type": "vulnerability_scan", "delay": 60},
                    {"event_type": "exploit_execution", "delay": 90},
                    {"event_type": "system_compromise", "delay": 120},
                ],
                "description": "Zero-day vulnerability exploitation",
                "mitre_tactics": ["Initial Access", "Execution"],
                "mitre_techniques": ["T1190", "T1203", "T1068"]
            },
            "living_off_the_land": {
                "steps": [
                    {"event_type": "native_tool_usage", "delay": 0},
                    {"event_type": "powershell_execution", "delay": 30},
                    {"event_type": "wmic_execution", "delay": 45},
                    {"event_type": "net_execution", "delay": 60},
                    {"event_type": "data_collection", "delay": 90},
                ],
                "description": "Living off the land techniques",
                "mitre_tactics": ["Execution", "Discovery", "Collection"],
                "mitre_techniques": ["T1059", "T1016", "T1005"]
            },
            "advanced_persistent_threat": {
                "steps": [
                    {"event_type": "initial_compromise", "delay": 0},
                    {"event_type": "persistence_established", "delay": 30},
                    {"event_type": "lateral_movement", "delay": 60},
                    {"event_type": "data_collection", "delay": 120, "repeat": 3},
                    {"event_type": "data_exfiltration", "delay": 240},
                    {"event_type": "cleanup", "delay": 300},
                ],
                "description": "Advanced persistent threat campaign",
                "mitre_tactics": ["Initial Access", "Persistence", "Lateral Movement", "Collection", "Exfiltration"],
                "mitre_techniques": ["T1190", "T1547", "T1021", "T1005", "T1041"]
            },
            "insider_threat": {
                "steps": [
                    {"event_type": "insider_access", "delay": 0},
                    {"event_type": "unauthorized_access", "delay": 30},
                    {"event_type": "data_copy", "delay": 60},
                    {"event_type": "external_device", "delay": 90},
                    {"event_type": "data_exfiltration", "delay": 120},
                ],
                "description": "Insider threat data exfiltration",
                "mitre_tactics": ["Initial Access", "Collection", "Exfiltration"],
                "mitre_techniques": ["T1078", "T1005", "T1052"]
            },
            "sql_injection_attack": {
                "steps": [
                    {"event_type": "web_request", "delay": 0},
                    {"event_type": "sql_injection", "delay": 15},
                    {"event_type": "database_query", "delay": 30},
                    {"event_type": "data_extraction", "delay": 45},
                    {"event_type": "data_exfiltration", "delay": 75},
                ],
                "description": "SQL injection web attack",
                "mitre_tactics": ["Initial Access", "Execution", "Exfiltration"],
                "mitre_techniques": ["T1190", "T1059", "T1041"]
            },
            "ddos_attack": {
                "steps": [
                    {"event_type": "botnet_command", "delay": 0},
                    {"event_type": "traffic_flood", "delay": 15, "repeat": 8},
                    {"event_type": "resource_exhaustion", "delay": 60},
                    {"event_type": "service_degradation", "delay": 90},
                    {"event_type": "system_overload", "delay": 120},
                ],
                "description": "Distributed denial of service attack",
                "mitre_tactics": ["Impact"],
                "mitre_techniques": ["T1498", "T1499", "T1529"]
            },
            "cryptomining": {
                "steps": [
                    {"event_type": "mining_software", "delay": 0},
                    {"event_type": "resource_consumption", "delay": 30, "repeat": 4},
                    {"event_type": "cpu_overload", "delay": 90},
                    {"event_type": "network_traffic", "delay": 120},
                    {"event_type": "wallet_connection", "delay": 150},
                ],
                "description": "Cryptocurrency mining malware",
                "mitre_tactics": ["Impact", "Command and Control"],
                "mitre_techniques": ["T1496", "T1071", "T1102"]
            },
            "rootkit_installation": {
                "steps": [
                    {"event_type": "kernel_module", "delay": 0},
                    {"event_type": "rootkit_deployment", "delay": 30},
                    {"event_type": "system_modification", "delay": 45},
                    {"event_type": "detection_evasion", "delay": 60},
                    {"event_type": "persistence_established", "delay": 90},
                ],
                "description": "Rootkit installation for stealth",
                "mitre_tactics": ["Defense Evasion", "Persistence"],
                "mitre_techniques": ["T1014", "T1547", "T1562"]
            },
            "man_in_the_middle": {
                "steps": [
                    {"event_type": "arp_poisoning", "delay": 0},
                    {"event_type": "traffic_interception", "delay": 15},
                    {"event_type": "credential_capture", "delay": 30},
                    {"event_type": "session_hijacking", "delay": 45},
                    {"event_type": "data_exfiltration", "delay": 75},
                ],
                "description": "Man-in-the-middle attack",
                "mitre_tactics": ["Credential Access", "Collection"],
                "mitre_techniques": ["T1557", "T1110", "T1056"]
            },
            "wifi_evil_twin": {
                "steps": [
                    {"event_type": "wifi_spoofing", "delay": 0},
                    {"event_type": "client_connection", "delay": 15},
                    {"event_type": "credential_capture", "delay": 30},
                    {"event_type": "data_interception", "delay": 45},
                    {"event_type": "data_exfiltration", "delay": 75},
                ],
                "description": "Evil twin WiFi access point attack",
                "mitre_tactics": ["Initial Access", "Credential Access"],
                "mitre_techniques": ["T1557", "T1110", "T1040"]
            },

            # ================================================================
            # Adaptive Trust & Deception Engine — Demo Scenarios
            # ================================================================

            "legit_admin_false_positive": {
                "description": (
                    "DEMO SCENARIO A — Legitimate Admin (False Positive).\n"
                    "Admin uploads a large quarterly backup (4 GB). The anomaly detector flags "
                    "it as a potential exfiltration event. The system routes the session to the "
                    "deception sandbox. Inside the sandbox the user stops immediately after the "
                    "upload — no probing, no injection, no escalation. The intent classifier "
                    "scores this as LEGIT_ANOMALY and the system recommends allowing real access."
                ),
                "mitre_tactics": ["Exfiltration"],
                "mitre_techniques": ["T1041"],
                "sandbox_demo": True,
                "expected_verdict": "LEGIT_ANOMALY",
                "steps": [
                    # Normal login from known user
                    {"event_type": "successful_login",    "delay": 0,   "metadata": {"user": "admin", "method": "SSO"}},
                    # Large file transfer (triggers anomaly)
                    {"event_type": "data_exfiltration",   "delay": 30,  "metadata": {"bytes": 4_200_000_000, "file": "quarterly_backup.tar.gz"}},
                    # System flags → sandbox routing
                    {"event_type": "sandbox_routing",     "delay": 35,  "metadata": {"reason": "abnormal_transfer_volume", "trust_score": 0.42}},
                    # User receives fake export confirmation — stops there
                    {"event_type": "file_access",         "delay": 60,  "metadata": {"path": "/data/backup", "result": "success (honey)"}},
                    # No further probing — session ends
                    {"event_type": "session_end",         "delay": 65,  "metadata": {"reason": "user_logout"}},
                    # Intent classification
                    {"event_type": "intent_classification","delay": 66,  "metadata": {"label": "LEGIT_ANOMALY", "confidence": 0.82}},
                    {"event_type": "analyst_decision",    "delay": 70,  "metadata": {"verdict": "ALLOW", "note": "Confirmed quarterly backup"}},
                ],
                "narrative": (
                    "Admin uploads 4 GB backup → flagged → sandboxed → stops immediately → "
                    "LEGIT_ANOMALY → analyst allows real access."
                ),
            },

            "attacker_sandbox_caught": {
                "description": (
                    "DEMO SCENARIO B — Confirmed Attacker Caught in Sandbox.\n"
                    "An attacker fails login 6 times using a credential-stuffing list, then "
                    "succeeds with a valid credential. The trust score drops to 0.21. The "
                    "session is routed to the deception sandbox. Inside, the attacker probes "
                    "12 distinct endpoints, injects SQL fragments, and escalates to /admin/export. "
                    "The intent classifier scores this as HACKER (0.94 confidence). "
                    "The system blocks the session and creates a SOC incident."
                ),
                "mitre_tactics": ["Credential Access", "Discovery", "Exfiltration"],
                "mitre_techniques": ["T1110", "T1046", "T1041", "T1190"],
                "sandbox_demo": True,
                "expected_verdict": "HACKER",
                "steps": [
                    # Credential stuffing storm
                    {"event_type": "brute_force",          "delay": 0,  "repeat": 6, "metadata": {"tool": "hydra", "target": "/login"}},
                    # Successful login after stuffing
                    {"event_type": "successful_login",     "delay": 45, "metadata": {"user": "r.wong", "source_ip": "185.220.101.55"}},
                    # Trust score critically low → sandbox
                    {"event_type": "sandbox_routing",      "delay": 46, "metadata": {"reason": "failure_success_chain+unknown_ip", "trust_score": 0.21}},
                    # Recon sweep inside sandbox
                    {"event_type": "network_scan",         "delay": 50, "metadata": {"paths_probed": 12}},
                    # SQL injection attempt
                    {"event_type": "sql_injection",        "delay": 60, "metadata": {"payload": "' OR '1'='1", "endpoint": "/v1/alerts"}},
                    # Escalation to admin endpoint
                    {"event_type": "privilege_escalation", "delay": 70, "metadata": {"target": "/admin/export", "result": "honey_response"}},
                    {"event_type": "data_exfiltration",    "delay": 80, "metadata": {"bytes": 0, "note": "fake data returned by honey API"}},
                    # Intent classification
                    {"event_type": "intent_classification","delay": 82, "metadata": {"label": "HACKER", "confidence": 0.94}},
                    # Block + escalate
                    {"event_type": "session_terminated",   "delay": 83, "metadata": {"action": "BLOCK", "incident": "INC-2024-0042"}},
                    {"event_type": "analyst_decision",     "delay": 90, "metadata": {"verdict": "BLOCK", "note": "Confirmed credential stuffing + recon + injection"}},
                ],
                "narrative": (
                    "Credential stuffing (6 failures) → succeeds → trust_score=0.21 → "
                    "sandboxed → probes 12 endpoints + SQL injection + admin escalation → "
                    "HACKER (94%) → BLOCK + SOC incident created."
                ),
            },

            # ================================================================
            # EDGE CASE SCENARIO — Identical Surface, Divergent Intent
            # ================================================================
            "identical_behavior_divergent_intent": {
                "description": (
                    "EDGE CASE — Suspicion-Blind Universal Containment.\n\n"
                    "TWO users hit the exact same trigger simultaneously:\n"
                    "  • User A (j.smith):  Real employee who forgot their password 10 times.\n"
                    "  • User B (x.anon):   Attacker running a credential-stuffing script.\n\n"
                    "Pre-auth signals are INDISTINGUISHABLE:\n"
                    "  - Same failure count (10), same timing pattern, same login endpoint.\n"
                    "  - Traditional binary systems would make a guess and be wrong 50% of the time.\n\n"
                    "AetherSentrix solution — Suspicion-Blind Universal Containment:\n"
                    "  - BOTH sessions are sandboxed immediately on the same trigger.\n"
                    "  - Neither user gets real system access.\n"
                    "  - The sandbox watches what each does AFTER successful auth.\n\n"
                    "Post-auth divergence (the real signal):\n"
                    "  • j.smith (dumb user):  Opens inbox, reads one report, logs out. 0 probes.\n"
                    "  • x.anon  (attacker):   Hits 9 endpoints in 30s, injects SQL, tries /admin.\n\n"
                    "Result:\n"
                    "  • j.smith → divergence_score=0.08 → CONFIRMED_LEGIT → real access granted.\n"
                    "  • x.anon  → divergence_score=0.91 → CONFIRMED_HACKER → BLOCK + SOC alert."
                ),
                "mitre_tactics": ["Credential Access", "Discovery"],
                "mitre_techniques": ["T1110", "T1046", "T1078"],
                "sandbox_demo": True,
                "ambiguous_session": True,       # Flag: uses AmbiguousSessionRegistry
                "expected_verdicts": {
                    "j.smith": "CONFIRMED_LEGIT",
                    "x.anon":  "CONFIRMED_HACKER",
                },
                "steps": [
                    # — Phase 1: Identical pre-auth (runs in parallel for both users) —
                    {"event_type": "brute_force", "delay": 0,  "repeat": 10,
                     "metadata": {"user": "j.smith", "note": "Forgot password — dumb user"}},
                    {"event_type": "brute_force", "delay": 0,  "repeat": 10,
                     "metadata": {"user": "x.anon",  "note": "Credential stuffing — attacker"}},

                    # Both succeed — trigger fires for both
                    {"event_type": "successful_login", "delay": 45,
                     "metadata": {"user": "j.smith", "source_ip": "10.1.2.34"}},
                    {"event_type": "successful_login", "delay": 45,
                     "metadata": {"user": "x.anon",  "source_ip": "185.220.101.77"}},

                    # BOTH routed to sandbox — same trigger, same treatment
                    {"event_type": "ambiguous_sandbox_routing", "delay": 46,
                     "metadata": {
                         "reason": "10_failures_then_success",
                         "users_sandboxed": ["j.smith", "x.anon"],
                         "note": "Suspicion-blind: identical surface → both contained"
                     }},

                    # — Phase 2: Post-auth divergence (dumb user) —
                    {"event_type": "file_access", "delay": 50,
                     "metadata": {"user": "j.smith", "path": "/inbox", "is_suspicious": False}},
                    {"event_type": "file_access", "delay": 55,
                     "metadata": {"user": "j.smith", "path": "/reports/q1.pdf", "is_suspicious": False}},
                    {"event_type": "session_end", "delay": 60,
                     "metadata": {"user": "j.smith", "reason": "user_logout"}},

                    # j.smith classified as LEGIT → granted real access
                    {"event_type": "intent_classification", "delay": 61,
                     "metadata": {
                         "user": "j.smith",
                         "label": "CONFIRMED_LEGIT",
                         "divergence_score": 0.08,
                         "action": "ALLOW — real access granted"
                     }},

                    # — Phase 2: Post-auth divergence (attacker) —
                    {"event_type": "network_scan", "delay": 50,
                     "metadata": {"user": "x.anon", "paths_probed": 9, "is_suspicious": True}},
                    {"event_type": "sql_injection", "delay": 58,
                     "metadata": {"user": "x.anon", "payload": "' OR 1=1 --", "endpoint": "/v1/users"}},
                    {"event_type": "privilege_escalation", "delay": 65,
                     "metadata": {"user": "x.anon", "target": "/admin/export", "result": "honey_response"}},

                    # x.anon classified as HACKER → blocked
                    {"event_type": "intent_classification", "delay": 67,
                     "metadata": {
                         "user": "x.anon",
                         "label": "CONFIRMED_HACKER",
                         "divergence_score": 0.91,
                         "action": "BLOCK + SOC incident INC-2024-0043"
                     }},
                ],
                "narrative": (
                    "Both j.smith and x.anon: 10 failures → success (identical). "
                    "Both sandboxed. j.smith: opens inbox, logs out → LEGIT (score=0.08) → ALLOW. "
                    "x.anon: probes 9 endpoints + SQL inject + admin escalation → HACKER (score=0.91) → BLOCK."
                ),
            },
        }


    @staticmethod
    def get_all_scenarios() -> List[str]:
        return list(ScenarioLibrary.get_scenarios().keys())

class EventGenerator:
    def generate_event(self, event_type: str, base_timestamp: float) -> Dict[str, Any]:
        event = {
            "event_id": f"sim-{random.randint(1000, 9999)}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(base_timestamp)),
            "source_layer": "simulation",
            "host": "workstation-01",
            "user": "alice",
            "source_ip": "10.0.1.12",
            "event_type": event_type,
            "action": "unknown",
            "outcome": "success",
        }

        # Initial Access Events
        if event_type == "phishing_click":
            event.update({
                "action": "click",
                "outcome": "success",
                "metadata": {"url": "malicious-link.com"}
            })
        elif event_type == "phishing_email":
            event.update({
                "action": "open",
                "outcome": "success",
                "metadata": {"sender": "attacker@evil.com"}
            })
        elif event_type == "drive_by_compromise":
            event.update({
                "action": "visit",
                "outcome": "success",
                "metadata": {"website": "compromised-site.com"}
            })
        elif event_type == "supply_chain_attack":
            event.update({
                "action": "install",
                "outcome": "success",
                "metadata": {"package": "malicious-library"}
            })

        # Execution Events
        elif event_type == "malware_delivery":
            event.update({
                "action": "download",
                "outcome": "success",
                "metadata": {"file": "malware.exe"}
            })
        elif event_type == "malware_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"process": "malware.exe"}
            })
        elif event_type == "powershell_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"command": "powershell.exe"}
            })
        elif event_type == "script_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"script": "malicious.ps1"}
            })
        elif event_type == "user_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"file": "trojan.exe"}
            })
        elif event_type == "command_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"command": "cmd.exe"}
            })
        elif event_type == "module_loading":
            event.update({
                "action": "load",
                "outcome": "success",
                "metadata": {"module": "evil.dll"}
            })

        # Persistence Events
        elif event_type == "persistence_established":
            event.update({
                "action": "create",
                "outcome": "success",
                "metadata": {"method": "registry"}
            })
        elif event_type == "registry_modification":
            event.update({
                "action": "modify",
                "outcome": "success",
                "metadata": {"key": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"}
            })
        elif event_type == "autorun_registry":
            event.update({
                "action": "create",
                "outcome": "success",
                "metadata": {"value": "MalwarePath"}
            })
        elif event_type == "service_creation":
            event.update({
                "action": "create",
                "outcome": "success",
                "metadata": {"service": "EvilService"}
            })
        elif event_type == "service_modification":
            event.update({
                "action": "modify",
                "outcome": "success",
                "metadata": {"service": "EvilService"}
            })
        elif event_type == "startup_folder_modification":
            event.update({
                "action": "create",
                "outcome": "success",
                "metadata": {"folder": "Startup"}
            })

        # Privilege Escalation Events
        elif event_type == "privilege_escalation":
            event.update({
                "action": "elevate",
                "outcome": "success",
                "metadata": {"from": "user", "to": "admin"}
            })
        elif event_type == "uac_bypass_attempt":
            event.update({
                "action": "bypass",
                "outcome": "success",
                "metadata": {"method": "dll_hijacking"}
            })
        elif event_type == "admin_privileges":
            event.update({
                "action": "grant",
                "outcome": "success",
                "metadata": {"level": "administrator"}
            })
        elif event_type == "system_access":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"resource": "system"}
            })
        elif event_type == "exploit_attempt":
            event.update({
                "action": "exploit",
                "outcome": "success",
                "metadata": {"vulnerability": "CVE-2023-XXXX"}
            })
        elif event_type == "system_compromise":
            event.update({
                "action": "compromise",
                "outcome": "success",
                "metadata": {"level": "system"}
            })
        elif event_type == "dll_placement":
            event.update({
                "action": "place",
                "outcome": "success",
                "metadata": {"file": "evil.dll"}
            })
        elif event_type == "dll_hijacking":
            event.update({
                "action": "hijack",
                "outcome": "success",
                "metadata": {"target": "system32"}
            })

        # Defense Evasion Events
        elif event_type == "process_injection":
            event.update({
                "action": "inject",
                "outcome": "success",
                "metadata": {"target_process": "explorer.exe"}
            })
        elif event_type == "memory_manipulation":
            event.update({
                "action": "manipulate",
                "outcome": "success",
                "metadata": {"operation": "write"}
            })
        elif event_type == "code_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"type": "shellcode"}
            })
        elif event_type == "anti_analysis":
            event.update({
                "action": "evade",
                "outcome": "success",
                "metadata": {"technique": "obfuscation"}
            })
        elif event_type == "file_obfuscation":
            event.update({
                "action": "obfuscate",
                "outcome": "success",
                "metadata": {"method": "encryption"}
            })
        elif event_type == "encoded_payload":
            event.update({
                "action": "encode",
                "outcome": "success",
                "metadata": {"encoding": "base64"}
            })
        elif event_type == "payload_decoding":
            event.update({
                "action": "decode",
                "outcome": "success",
                "metadata": {"encoding": "base64"}
            })
        elif event_type == "security_tool_discovery":
            event.update({
                "action": "discover",
                "outcome": "success",
                "metadata": {"tool": "antivirus"}
            })
        elif event_type == "tool_disable_attempt":
            event.update({
                "action": "disable",
                "outcome": "success",
                "metadata": {"tool": "antivirus"}
            })
        elif event_type == "antivirus_disable":
            event.update({
                "action": "disable",
                "outcome": "success",
                "metadata": {"service": "Windows Defender"}
            })
        elif event_type == "firewall_disable":
            event.update({
                "action": "disable",
                "outcome": "success",
                "metadata": {"service": "Windows Firewall"}
            })

        # Credential Access Events
        elif event_type == "credential_access_attempt":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"target": "lsass"}
            })
        elif event_type == "lsass_dump":
            event.update({
                "action": "dump",
                "outcome": "success",
                "metadata": {"process": "lsass.exe"}
            })
        elif event_type == "password_dump":
            event.update({
                "action": "dump",
                "outcome": "success",
                "metadata": {"hashes": 25}
            })
        elif event_type == "credential_theft":
            event.update({
                "action": "steal",
                "outcome": "success",
                "metadata": {"credentials": "admin:password"}
            })
        elif event_type == "account_lockout":
            event.update({
                "action": "lock",
                "outcome": "success",
                "metadata": {"account": "alice"}
            })
        elif event_type == "password_spray":
            event.update({
                "action": "spray",
                "outcome": "success",
                "metadata": {"attempts": 50}
            })
        elif event_type == "kerberos_ticket_request":
            event.update({
                "action": "request",
                "outcome": "success",
                "metadata": {"service": "krbtgt"}
            })
        elif event_type == "service_ticket_extraction":
            event.update({
                "action": "extract",
                "outcome": "success",
                "metadata": {"tickets": 5}
            })
        elif event_type == "offline_cracking":
            event.update({
                "action": "crack",
                "outcome": "success",
                "metadata": {"hashes_cracked": 3}
            })

        # Discovery Events
        elif event_type == "network_scan":
            event.update({
                "action": "scan",
                "outcome": "success",
                "metadata": {"range": "192.168.1.0/24"}
            })
        elif event_type == "port_scan":
            event.update({
                "action": "scan",
                "outcome": "success",
                "metadata": {"ports": "1-1024"}
            })
        elif event_type == "service_enumeration":
            event.update({
                "action": "enumerate",
                "outcome": "success",
                "metadata": {"services": 15}
            })
        elif event_type == "host_discovery":
            event.update({
                "action": "discover",
                "outcome": "success",
                "metadata": {"hosts": 25}
            })
        elif event_type == "vulnerability_scan":
            event.update({
                "action": "scan",
                "outcome": "success",
                "metadata": {"vulnerabilities": 3}
            })
        elif event_type == "system_info_gathering":
            event.update({
                "action": "gather",
                "outcome": "success",
                "metadata": {"info": "system_info"}
            })
        elif event_type == "os_discovery":
            event.update({
                "action": "discover",
                "outcome": "success",
                "metadata": {"os": "Windows 10"}
            })
        elif event_type == "software_discovery":
            event.update({
                "action": "discover",
                "outcome": "success",
                "metadata": {"software": 45}
            })
        elif event_type == "user_account_discovery":
            event.update({
                "action": "discover",
                "outcome": "success",
                "metadata": {"users": 12}
            })
        elif event_type == "permission_discovery":
            event.update({
                "action": "discover",
                "outcome": "success",
                "metadata": {"permissions": "admin"}
            })
        elif event_type == "file_system_enumeration":
            event.update({
                "action": "enumerate",
                "outcome": "success",
                "metadata": {"files": 1250}
            })
        elif event_type == "directory_listing":
            event.update({
                "action": "list",
                "outcome": "success",
                "metadata": {"directory": "C:\\Users"}
            })
        elif event_type == "file_search":
            event.update({
                "action": "search",
                "outcome": "success",
                "metadata": {"pattern": "*.docx"}
            })
        elif event_type == "sensitive_file_access":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"file": "passwords.txt"}
            })

        # Lateral Movement Events
        elif event_type == "lateral_movement":
            event.update({
                "action": "move",
                "outcome": "success",
                "metadata": {"target": "server-02"}
            })
        elif event_type == "remote_service_creation":
            event.update({
                "action": "create",
                "outcome": "success",
                "metadata": {"service": "psexec"}
            })
        elif event_type == "powershell_remote":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"target": "server-02"}
            })
        elif event_type == "rdp_connection":
            event.update({
                "action": "connect",
                "outcome": "success",
                "metadata": {"protocol": "RDP"}
            })
        elif event_type == "session_hijacking":
            event.update({
                "action": "hijack",
                "outcome": "success",
                "metadata": {"session": "alice"}
            })
        elif event_type == "smb_connection":
            event.update({
                "action": "connect",
                "outcome": "success",
                "metadata": {"share": "\\\\server\\share"}
            })
        elif event_type == "ntlm_relay":
            event.update({
                "action": "relay",
                "outcome": "success",
                "metadata": {"protocol": "NTLM"}
            })
        elif event_type == "domain_admin_access":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"privilege": "domain_admin"}
            })

        # Collection Events
        elif event_type == "data_collection":
            event.update({
                "action": "collect",
                "outcome": "success",
                "metadata": {"data_type": "documents"}
            })
        elif event_type == "file_access":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"file": "confidential.docx"}
            })
        elif event_type == "clipboard_data":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"data": "clipboard"}
            })
        elif event_type == "browser_data":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"data": "browser_history"}
            })
        elif event_type == "data_staging":
            event.update({
                "action": "stage",
                "outcome": "success",
                "metadata": {"location": "temp"}
            })
        elif event_type == "email_access":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"mailbox": "alice@company.com"}
            })
        elif event_type == "email_search":
            event.update({
                "action": "search",
                "outcome": "success",
                "metadata": {"query": "confidential"}
            })
        elif event_type == "email_download":
            event.update({
                "action": "download",
                "outcome": "success",
                "metadata": {"emails": 15}
            })
        elif event_type == "screen_capture":
            event.update({
                "action": "capture",
                "outcome": "success",
                "metadata": {"type": "screenshot"}
            })
        elif event_type == "keylogger_deployment":
            event.update({
                "action": "deploy",
                "outcome": "deploy",
                "outcome": "success",
                "metadata": {"type": "keylogger"}
            })
        elif event_type == "input_capture":
            event.update({
                "action": "capture",
                "outcome": "success",
                "metadata": {"type": "keystrokes"}
            })

        # Command and Control Events
        elif event_type == "c2_beacon":
            event.update({
                "destination_ip": "203.0.113.1",
                "action": "connect",
                "metadata": {"beacon_interval": 45}
            })
        elif event_type == "c2_communication":
            event.update({
                "destination_ip": "203.0.113.1",
                "action": "communicate",
                "metadata": {"protocol": "HTTPS"}
            })
        elif event_type == "dns_query":
            event.update({
                "action": "query",
                "outcome": "success",
                "metadata": {"domain": "c2.evil.com"}
            })
        elif event_type == "data_encoding":
            event.update({
                "action": "encode",
                "outcome": "success",
                "metadata": {"method": "DNS"}
            })
        elif event_type == "command_receipt":
            event.update({
                "action": "receive",
                "outcome": "success",
                "metadata": {"command": "exfiltrate"}
            })
        elif event_type == "http_request":
            event.update({
                "action": "request",
                "outcome": "success",
                "metadata": {"method": "GET"}
            })
        elif event_type == "web_service_communication":
            event.update({
                "action": "communicate",
                "outcome": "success",
                "metadata": {"service": "onedrive"}
            })

        # Exfiltration Events
        elif event_type == "data_exfiltration":
            event.update({
                "action": "exfiltrate",
                "outcome": "success",
                "metadata": {"size": "50MB"}
            })
        elif event_type == "data_compression":
            event.update({
                "action": "compress",
                "outcome": "success",
                "metadata": {"algorithm": "zip"}
            })
        elif event_type == "data_encryption":
            event.update({
                "action": "encrypt",
                "outcome": "success",
                "metadata": {"algorithm": "AES"}
            })
        elif event_type == "c2_exfiltration":
            event.update({
                "action": "exfiltrate",
                "outcome": "success",
                "metadata": {"channel": "C2"}
            })
        elif event_type == "ftp_connection":
            event.update({
                "action": "connect",
                "outcome": "success",
                "metadata": {"server": "ftp.evil.com"}
            })
        elif event_type == "data_upload":
            event.update({
                "action": "upload",
                "outcome": "success",
                "metadata": {"size": "25MB"}
            })
        elif event_type == "file_transfer":
            event.update({
                "action": "transfer",
                "outcome": "success",
                "metadata": {"files": 5}
            })
        elif event_type == "connection_cleanup":
            event.update({
                "action": "cleanup",
                "outcome": "success",
                "metadata": {"connections": 3}
            })
        elif event_type == "log_deletion":
            event.update({
                "action": "delete",
                "outcome": "success",
                "metadata": {"logs": "ftp_logs"}
            })
        elif event_type == "cloud_service_auth":
            event.update({
                "action": "authenticate",
                "outcome": "success",
                "metadata": {"service": "dropbox"}
            })
        elif event_type == "file_sync":
            event.update({
                "action": "sync",
                "outcome": "success",
                "metadata": {"files": 10}
            })

        # Impact Events
        elif event_type == "ransomware_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"type": "ransomware"}
            })
        elif event_type == "file_encryption":
            event.update({
                "action": "encrypt",
                "outcome": "success",
                "metadata": {"files": 150}
            })
        elif event_type == "ransom_note":
            event.update({
                "action": "create",
                "outcome": "success",
                "metadata": {"file": "README.txt"}
            })
        elif event_type == "system_shutdown":
            event.update({
                "action": "shutdown",
                "outcome": "success",
                "metadata": {"force": True}
            })
        elif event_type == "data_destruction":
            event.update({
                "action": "destroy",
                "outcome": "success",
                "metadata": {"data": "critical"}
            })
        elif event_type == "data_identification":
            event.update({
                "action": "identify",
                "outcome": "success",
                "metadata": {"targets": 20}
            })
        elif event_type == "file_deletion":
            event.update({
                "action": "delete",
                "outcome": "success",
                "metadata": {"files": 50}
            })
        elif event_type == "disk_wiping":
            event.update({
                "action": "wipe",
                "outcome": "success",
                "metadata": {"disk": "C:"}
            })
        elif event_type == "system_damage":
            event.update({
                "action": "damage",
                "outcome": "success",
                "metadata": {"component": "mbr"}
            })
        elif event_type == "evidence_destruction":
            event.update({
                "action": "destroy",
                "outcome": "success",
                "metadata": {"evidence": "logs"}
            })
        elif event_type == "service_stop":
            event.update({
                "action": "stop",
                "outcome": "success",
                "metadata": {"service": "database"}
            })
        elif event_type == "process_termination":
            event.update({
                "action": "terminate",
                "outcome": "success",
                "metadata": {"processes": 15}
            })
        elif event_type == "resource_exhaustion":
            event.update({
                "action": "exhaust",
                "outcome": "success",
                "metadata": {"resource": "cpu"}
            })
        elif event_type == "system_crash":
            event.update({
                "action": "crash",
                "outcome": "success",
                "metadata": {"component": "kernel"}
            })
        elif event_type == "service_disruption":
            event.update({
                "action": "disrupt",
                "outcome": "success",
                "metadata": {"services": 5}
            })

        # Additional Events
        elif event_type == "brute_force":
            event.update({
                "action": "login",
                "outcome": "failure",
                "metadata": {"attempts": 10}
            })
        elif event_type == "successful_login":
            event.update({
                "action": "login",
                "outcome": "success",
                "metadata": {"user": "alice"}
            })
        elif event_type == "malware_infection":
            event.update({
                "action": "infect",
                "outcome": "success",
                "metadata": {"type": "trojan"}
            })
        elif event_type == "exploit_public_facing_app":
            event.update({
                "action": "exploit",
                "outcome": "success",
                "metadata": {"app": "web_server"}
            })
        elif event_type == "web_shell_deployment":
            event.update({
                "action": "deploy",
                "outcome": "success",
                "metadata": {"shell": "webshell.php"}
            })
        elif event_type == "scheduled_task_creation":
            event.update({
                "action": "create",
                "outcome": "success",
                "metadata": {"task": "EvilTask"}
            })
        elif event_type == "native_tool_usage":
            event.update({
                "action": "use",
                "outcome": "success",
                "metadata": {"tool": "net.exe"}
            })
        elif event_type == "wmic_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"command": "wmic"}
            })
        elif event_type == "net_execution":
            event.update({
                "action": "execute",
                "outcome": "success",
                "metadata": {"command": "net"}
            })
        elif event_type == "insider_access":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"user": "insider"}
            })
        elif event_type == "unauthorized_access":
            event.update({
                "action": "access",
                "outcome": "success",
                "metadata": {"resource": "confidential"}
            })
        elif event_type == "data_copy":
            event.update({
                "action": "copy",
                "outcome": "success",
                "metadata": {"size": "100MB"}
            })
        elif event_type == "external_device":
            event.update({
                "action": "connect",
                "outcome": "success",
                "metadata": {"device": "usb_drive"}
            })
        elif event_type == "web_request":
            event.update({
                "action": "request",
                "outcome": "success",
                "metadata": {"url": "vulnerable-site.com"}
            })
        elif event_type == "sql_injection":
            event.update({
                "action": "inject",
                "outcome": "success",
                "metadata": {"payload": "1' OR '1'='1"}
            })
        elif event_type == "database_query":
            event.update({
                "action": "query",
                "outcome": "success",
                "metadata": {"query": "SELECT * FROM users"}
            })
        elif event_type == "data_extraction":
            event.update({
                "action": "extract",
                "outcome": "success",
                "metadata": {"records": 1000}
            })
        elif event_type == "botnet_command":
            event.update({
                "action": "command",
                "outcome": "success",
                "metadata": {"command": "ddos"}
            })
        elif event_type == "traffic_flood":
            event.update({
                "action": "flood",
                "outcome": "success",
                "metadata": {"target": "victim.com"}
            })
        elif event_type == "service_degradation":
            event.update({
                "action": "degrade",
                "outcome": "success",
                "metadata": {"service": "web"}
            })
        elif event_type == "system_overload":
            event.update({
                "action": "overload",
                "outcome": "success",
                "metadata": {"resource": "memory"}
            })
        elif event_type == "mining_software":
            event.update({
                "action": "deploy",
                "outcome": "success",
                "metadata": {"coin": "monero"}
            })
        elif event_type == "resource_consumption":
            event.update({
                "action": "consume",
                "outcome": "success",
                "metadata": {"resource": "cpu"}
            })
        elif event_type == "cpu_overload":
            event.update({
                "action": "overload",
                "outcome": "success",
                "metadata": {"usage": "95%"}
            })
        elif event_type == "network_traffic":
            event.update({
                "action": "generate",
                "outcome": "success",
                "metadata": {"volume": "high"}
            })
        elif event_type == "wallet_connection":
            event.update({
                "action": "connect",
                "outcome": "success",
                "metadata": {"wallet": "attacker_wallet"}
            })
        elif event_type == "kernel_module":
            event.update({
                "action": "load",
                "outcome": "success",
                "metadata": {"module": "rootkit.ko"}
            })
        elif event_type == "rootkit_deployment":
            event.update({
                "action": "deploy",
                "outcome": "success",
                "metadata": {"type": "kernel"}
            })
        elif event_type == "system_modification":
            event.update({
                "action": "modify",
                "outcome": "success",
                "metadata": {"component": "kernel"}
            })
        elif event_type == "detection_evasion":
            event.update({
                "action": "evade",
                "outcome": "success",
                "metadata": {"method": "rootkit"}
            })
        elif event_type == "arp_poisoning":
            event.update({
                "action": "poison",
                "outcome": "success",
                "metadata": {"protocol": "ARP"}
            })
        elif event_type == "traffic_interception":
            event.update({
                "action": "intercept",
                "outcome": "success",
                "metadata": {"traffic": "all"}
            })
        elif event_type == "credential_capture":
            event.update({
                "action": "capture",
                "outcome": "success",
                "metadata": {"credentials": 5}
            })
        elif event_type == "wifi_spoofing":
            event.update({
                "action": "spoof",
                "outcome": "success",
                "metadata": {"ssid": "FreeWiFi"}
            })
        elif event_type == "client_connection":
            event.update({
                "action": "connect",
                "outcome": "success",
                "metadata": {"clients": 12}
            })
        elif event_type == "data_interception":
            event.update({
                "action": "intercept",
                "outcome": "success",
                "metadata": {"data": "credentials"}
            })
        elif event_type == "zero_day_discovery":
            event.update({
                "action": "discover",
                "outcome": "success",
                "metadata": {"vulnerability": "zero_day"}
            })
        elif event_type == "exploit_development":
            event.update({
                "action": "develop",
                "outcome": "success",
                "metadata": {"type": "exploit"}
            })
        elif event_type == "initial_compromise":
            event.update({
                "action": "compromise",
                "outcome": "success",
                "metadata": {"method": "zero_day"}
            })
        elif event_type == "cleanup":
            event.update({
                "action": "cleanup",
                "outcome": "success",
                "metadata": {"artifacts": 15}
            })
        elif event_type == "system_reboot":
            event.update({
                "action": "reboot",
                "outcome": "success",
                "metadata": {"reason": "persistence"}
            })

        return event

    def generate_events(self, event_type: str, count: int) -> List[Dict[str, Any]]:
        events = []
        base_time = time.time()
        for i in range(count):
            event_time = base_time + (i * 1)  # 1 second apart
            event = self.generate_event(event_type, event_time)
            events.append(event)
        return events

class AttackSimulator:
    def __init__(self, scenario_library: ScenarioLibrary, event_generator: EventGenerator):
        self.scenario_library = scenario_library
        self.event_generator = event_generator

    def run_simulation(self, scenario_name: str) -> Dict[str, Any]:
        scenario = self.scenario_library.get_scenarios().get(scenario_name)
        if not scenario:
            return {"error": "Scenario not found"}

        events = []
        base_time = time.time()

        for step in scenario["steps"]:
            event_time = base_time + step["delay"]
            event = self.event_generator.generate_event(step["event_type"], event_time)
            events.append(event)

            if step.get("repeat"):
                for i in range(1, step["repeat"]):
                    repeat_time = event_time + (i * step.get("delay", 45))
                    repeat_event = self.event_generator.generate_event(step["event_type"], repeat_time)
                    events.append(repeat_event)

        return {
            "simulation_id": f"sim-{random.randint(10000, 99999)}",
            "scenario": scenario_name,
            "events_generated": len(events),
            "events": events,
            "description": scenario["description"]
        }
