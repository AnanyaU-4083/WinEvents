CREATE DATABASE event_management_system;
USE event_management_system;

CREATE TABLE Event (
	event_id INT PRIMARY KEY,
	event_name VARCHAR(150) NOT NULL,
	start_date DATETIME NOT NULL,
	end_date DATETIME NOT NULL,
	budget DECIMAL,
	event_type_id INT,
	venue_id INT,
	FOREIGN KEY (event_type_id) REFERENCES EventType(event_type_id),
	FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE Employee(
	employee_id INT PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	job_title VARCHAR(100),
	email VARCHAR(150) NOT NULL,
	task VARCHAR(250),
	org_id INT NOT NULL,
	FOREIGN KEY (org_id) REFERENCES Organization(org_id)
);

CREATE TABLE Organization (
	org_id INT PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	email VARCHAR(150) NOT NULL,
	phone VARCHAR(20) NOT NULL,
	contact_version VARCHAR(150) NOT NULL
);

CREATE TABLE EventType (
	event_type_id INT PRIMARY KEY,
	event_type VARCHAR(100) NOT NULL
);

CREATE TABLE Venue(
	venue_id INT PRIMARY KEY,
	address VARCHAR(250) NOT NULL,
	capacity INT NOT NULL
);

CREATE TABLE Attendee (
	attendee_id INT PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	email VARCHAR(150) NOT NULL,
	phone VARCHAR(20) NOT NULL,
	ticket VARCHAR(50) NOT NULL
	
);

CREATE TABLE EventEmployee (
	event_id INT,
	employee_id INT,
	PRIMARY KEY (event_id, employee_id),
	FOREIGN KEY (event_id) REFERENCES Event(event_id),
	FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

CREATE TABLE EventAttendee (
	event_id INT,
	attendee_id INT,
	registered_time DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (event_id, attendee_id),
	FOREIGN KEY (event_id) REFERENCES Event(event_id),
	FOREIGN KEY (attendee_id) REFERENCES Attendee(attendee_id)
);

