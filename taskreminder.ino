
#include <DuoBLE.h>
SYSTEM_MODE(MANUAL);

#include <Adafruit_GFX.h>
#include <gfxfont.h>
#include <Adafruit_SSD1306.h>

const int OLED_CLK   = D3;
const int OLED_MOSI  = D4;
const int OLED_RESET = D5;
const int OLED_DC    = D6;
const int OLED_CS    = D7;

Adafruit_SSD1306 display(OLED_MOSI, OLED_CLK, OLED_DC, OLED_RESET, OLED_CS);

/**<------------global variables section----------------->**/
int N = 100;
int id_1; int id_2; int id_3;
int currTime = Time.now();
int dueDate; int priority; String taskName;
int idArray[] = {priority, dueDate};
String s = "";
long alarmArray[] = {900, 600, 300};
long longTimeFromNow = 2147483647;
long alarmDueDateArray[] = {longTimeFromNow, longTimeFromNow, longTimeFromNow};
int boolElement = 0;
int indexOfAlarmArray;
/**<------------global variables section----------------->**/

/**<---------------------BLE SETUP----------------------->**/
const char * const deviceName = "skye";

BLEService simpleCustomService("f9dab382-6439-4707-b4c9-912b383115fe");
BLECharacteristic currentTimeCharacteristic("FF01", ATT_PROPERTY_NOTIFY | ATT_PROPERTY_WRITE, 4, 4);
BLECharacteristic taskDueDateCharacteristic("FF02", ATT_PROPERTY_WRITE, 5);
BLECharacteristic taskPriorityCharacteristic("FF03", ATT_PROPERTY_WRITE, 2);
BLECharacteristic taskNameCharacteristic("FF04", ATT_PROPERTY_WRITE);
BLECharacteristic deleteElementCharacteristic("FF05", ATT_PROPERTY_NOTIFY | ATT_PROPERTY_WRITE, 2, 1);

void BLE_connected() {
  Serial.println("Central Connected");
}
void BLE_disconnected() {
  Serial.println("Central Disconnected");
}
/**<---------------------BLE SETUP----------------------->**/

void currentTimeCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason) {
  if (reason == NOTIFICATIONS_ENABLED) {
    Serial.println("*---Current time callback function || Notify---*");
    Serial.println("Notifying current time: ");
//    int currTime = Time.now();
    currTime = Time.now();

    //set cuttTime to an array that can be sent back to the app
    byte currTimeValue[4];
    currTimeValue[0] = currTime >> 24;
    currTimeValue[1] = currTime >> 16;
    currTimeValue[2] = currTime >> 8;
    currTimeValue[3] = currTime;
    currentTimeCharacteristic.setValue(currTimeValue, 4);
        
    Serial.print(Time.hour());
    Serial.print(":");
    Serial.print(Time.minute());
    Serial.print(":");
    Serial.println(Time.second());
    Serial.print("In UTC time: ");
    Serial.println(currTime);
    currentTimeCharacteristic.sendNotify();
  }
  
  if (reason == POSTWRITE) {
    Serial.println("*---Current time callback function || Write---*");
    Serial.println("Setting current time to: ");
    byte currTimeValue[4];
    currentTimeCharacteristic.getValue(currTimeValue, 4);
    currTime = currTimeValue[0] << 24 | currTimeValue[1] << 16 | currTimeValue[2] << 8 | currTimeValue[3];
    Time.setTime(currTime);
    Serial.print(Time.hour());
    Serial.print(":");
    Serial.print(Time.minute());
    Serial.print(":");
    Serial.println(Time.second());
    Serial.print("In UTC time: ");
    Serial.println(currTime);
  }
}

//Create the display for when no tasks are set currently. Overwrites tasks and puts "DISPLAY TASK"
void defaultDisplay() {
  display.drawRect(0, 0, 128, 33, 0x0000);
  display.fillRect(0, 0, 128, 33, 0x0000);
  
  display.setCursor(0, 0);
  display.println("* * * * * * * * * * *");
  display.setCursor(0, 12);
  display.println("    DISPLAY TASK     ");
  display.setCursor(0, 24);
  display.println("* * * * * * * * * * *");
}

//check time for if currTime is past the due date. If it is, then the buzzer will go off and wait for the next increment on the timer
void checkTime() {

  //if one of the alarms should go off, then the buzzer sets and changes the array
  for (int i = 0; i < 3; i++) {
    if (Time.now() >= alarmDueDateArray[i]) {
      Serial.println("ALARM!");
      tone(D0, 50, 10000);
      alarmDueDateArray[i] = longTimeFromNow; 
      indexOfAlarmArray = i;
    }
  }

  //if the dueDate has passed, the alarm goes off and the task deletes itself
  if (Time.now() >= dueDate) {
    path_to_stopAlarmTimer();
    tone(D0, 50, 10000);
    defaultDisplay();

    //turns boolElement to 1 to send to app to delete task from app
    boolElement = 1;

    byte deleteElementValue[2];
    deleteElementValue[0] = boolElement;
    deleteElementValue[1] = id_1;
    deleteElementCharacteristic.setValue(deleteElementValue, 2);

    deleteElementCharacteristic.sendNotify();
    Serial.println("sent notify to delete the task on app.");

    //reset to 0 so tasks are not constantly deleted
    boolElement = 0;
  }
 
}

Timer alarmTimer(1000, checkTime);

void path_to_stopAlarmTimer() {
  alarmTimer.stop();
}

void taskDueDateCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason) {
  if (reason == POSTWRITE) {
    Serial.println("*---Task due date callback function---*");
    byte value[5];
    taskDueDateCharacteristic.getValue(value, 5);
    id_1 = value[0];
    Serial.print("id_1: ");
    Serial.println(id_1);

    //puts sent value into an int that can be understood by humans after read in. Maintains the id so communication between devices is possible
    dueDate = value[1] << 24 | value[2] << 16 | value[3] << 8 | value[4];
    Serial.print("Due date set to ");
    Serial.print(dueDate);
    Serial.println(" UTC seconds.");

    //sets alarms to go off at 15, 10, and 5 minutes before
    alarmDueDateArray[0]=dueDate-alarmArray[0];
    alarmDueDateArray[1]=dueDate-alarmArray[1];
    alarmDueDateArray[2]=dueDate-alarmArray[2];
    Serial.print("First alarm will go on at: ");
    Serial.print(alarmDueDateArray[0]);
    Serial.println(" UTC seconds.");
    Serial.print("Second alarm will go on at: ");
    Serial.print(alarmDueDateArray[1]);
    Serial.println(" UTC seconds.");
    Serial.print("Third alarm will go on at: ");
    Serial.print(alarmDueDateArray[2]);
    Serial.println(" UTC seconds.");

    // when there is less than 15 min left until the due date
    // 2000 - 900 > 1000, 2000 - 900 <= 1800
    if (dueDate - alarmArray[0] <= Time.now()) {
      alarmDueDateArray[0] = longTimeFromNow;
      Serial.println("less than 15 min left until the due date.");
      Serial.print("Alarm due date arrays: [");
      Serial.print(alarmDueDateArray[0]);
      Serial.print(", ");
      Serial.print(alarmDueDateArray[1]);
      Serial.print(", ");
      Serial.print(alarmDueDateArray[2]);
      Serial.println("]");
    }
    // when there is less than 10 min left until the due date
    if (dueDate - alarmArray[1] <= Time.now()) {
      alarmDueDateArray[1] = longTimeFromNow;
      Serial.println("less than 10 min left until the due date.");
      Serial.print("Alarm due date arrays: [");
      Serial.print(alarmDueDateArray[0]);
      Serial.print(", ");
      Serial.print(alarmDueDateArray[1]);
      Serial.print(", ");
      Serial.print(alarmDueDateArray[2]);
      Serial.println("]");
    }
    // when there is less than 5 min left until the due date
    if (dueDate - alarmArray[2] <= Time.now()) {
      alarmDueDateArray[2] = longTimeFromNow;
      Serial.println("less than 5 min left until the due date.");
      Serial.print("Alarm due date arrays: [");
      Serial.print(alarmDueDateArray[0]);
      Serial.print(", ");
      Serial.print(alarmDueDateArray[1]);
      Serial.print(", ");
      Serial.print(alarmDueDateArray[2]);
      Serial.println("]");
    }

    
    alarmTimer.start();

    display.drawRect(0, 16, 128, 8, 0x0000);
    display.fillRect(0, 16, 128, 8, 0x0000);
    display.drawRect(64, 24, 64, 8, 0x0000);
    display.fillRect(64, 24, 64, 8, 0x0000);

    display.drawRect(0, 17, 128, 15, 0x0000);
    display.fillRect(0, 17, 128, 15, 0x0000);

        
    display.setCursor(0, 17);

    //prints due date on display, different options for if a 0 is needed before monnths, or if non number characters are sent
    display.print("Due date:  ");
    if (Time.month(dueDate) < 10) {
      display.print("0");
      display.print(Time.month(dueDate));
    }
    else if (Time.month(dueDate) >= 10) {
      display.print(Time.month(dueDate));
    }
    display.print("/");
    if (Time.day(dueDate) < 10) {
      display.print("0");
      display.print(Time.day(dueDate));
    }
    else if (Time.day(dueDate) >= 10) {
      display.print(Time.day(dueDate));
    }
    display.print("/");
    display.println(Time.year(dueDate));
    display.print("             ");
    if (Time.hour(dueDate) < 10) {
      display.print("0");
      display.print(Time.hour(dueDate));
    }
    else if (Time.hour(dueDate) >= 10) {
      display.print(Time.hour(dueDate));
    }
    display.print(":");
    if (Time.minute(dueDate) < 10) {
      display.print("0");
      display.print(Time.minute(dueDate));
    }
    else if (Time.minute(dueDate) >= 10) {
      display.print(Time.minute(dueDate));
    }
    display.print(":");
    if (Time.second(dueDate) < 10) {
      display.print("0");
      display.print(Time.second(dueDate));
    }
    else if (Time.second(dueDate) >= 10) {
      display.print(Time.second(dueDate));
    }
    display.println("---------------------");
    
    

  }
}

void taskPriorityCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason) {
  if (reason == POSTWRITE) {
    Serial.println("*---Task priority callback function---*");
    byte value[2];
    taskPriorityCharacteristic.getValue(value, 2);
    id_2 = value[0];
    priority = value[1];
    Serial.print("id_2: ");
    Serial.println(id_2);
    Serial.print("Task priority set to ");
    Serial.print(value[1]);
    Serial.println(".");

    display.drawRect(0, 24, 50, 9, 0x0000);
    display.fillRect(0, 24, 50, 9, 0x0000);

    display.setCursor(0, 18);
    display.println();

    //priority is represented by number of circles. Higher priority has more circles
    if (priority == 0) {
      display.print("OOOOO");
    }
    else if (priority == 1) {
      display.print("OOOO");
    }
    else if (priority == 2) {
      display.print("OOO");
    }
    else if (priority == 3) {
      display.print("OO");
    }
    else if (priority == 4) {
      display.print("O");
    }
    else if (priority == 5) {
      // do nothing
    }
    
  }
}

void taskNameCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason) {
  if (reason == POSTWRITE) {
    Serial.println("*---Task name callback function---*");
    byte value[20];
    int bytes = taskNameCharacteristic.getValue(value, 20);

    id_3 = value[0]; // << 16 8 0 when value[0][1][2]
    Serial.print("id_3: ");
    Serial.println(id_3);

    s = "";

    //places string name into s
    Serial.print("Task name is: ");
      for (int i = 1; i < bytes; i++) {
        s = s + (String)(char)value[i];
      }

    s.trim();

    display.drawRect(0, 0, 128, 16, 0x0000);
    display.fillRect(0, 0, 128, 16, 0x0000);

    display.setCursor(0,0);
    display.println();
    display.println("---------------------");

    //displays the name of task on the display. S is the string name that is displayed
    display.setCursor(0,0);
    display.print("[");
    display.print(s);
    display.println("]");
    
    taskName = s;

    Serial.println(s);
  }
}

void deleteElementCallback(BLERecipient recipient, BLECharacteristicCallbackReason reason) {
  if (reason == POSTWRITE) {
    Serial.println("*---Delete element callback function || Write---*");
    byte value[1];
    deleteElementCharacteristic.getValue(value, 1);

    //the value is a boolean, so if the value is 1, then we want to delete the element
    if (value[0] == 1) {
      alarmTimer.stop();
      defaultDisplay();
      Serial.println("Deleted the display.");
    }
  }
  if (reason == NOTIFICATIONS_ENABLED) {
    Serial.println("*---Delete element callback function || Notify---*");
    Serial.print("Current boolean value is: ");

    //if the element is 0, then it should not delete
    if (boolElement == 0) {
      Serial.println("False (0)");
    }
    else if (boolElement == 1) {
      Serial.println("True (1)");
    }

    //sends over the boolean value and the id
    byte deleteElementValue[2];
    deleteElementValue[0] = boolElement;
    deleteElementValue[1] = 99;
    deleteElementCharacteristic.setValue(deleteElementValue, 2);

    deleteElementCharacteristic.sendNotify();
  }
}

/**<---------------Callback Functions-------------------->**/

void setup() {
  delay(2000);
  Serial.begin(9600);
  pinMode(D1, INPUT_PULLUP);
  pinMode(D2, INPUT_PULLUP);
  attachInterrupt(D1, onButton_call, FALLING);
  attachInterrupt(D2, offButton_call, FALLING);
  Serial.println("Program Starts");

  int currTime = Time.now();
  byte currTimeValue[4];
  currTimeValue[0] = currTime >> 24;
  currTimeValue[1] = currTime >> 16;
  currTimeValue[2] = currTime >> 8;
  currTimeValue[3] = currTime;
  currentTimeCharacteristic.setValue(currTimeValue, 4);
  currentTimeCharacteristic.setCallback(currentTimeCallback);
  simpleCustomService.addCharacteristic(currentTimeCharacteristic);

  byte dueDateValue[] = {0xF2,0xA5,0x23,0x80};
  taskDueDateCharacteristic.setValue(dueDateValue, 4);
  taskDueDateCharacteristic.setCallback(taskDueDateCallback);
  simpleCustomService.addCharacteristic(taskDueDateCharacteristic);

  byte priorityValue[] = {0};
  taskPriorityCharacteristic.setValue(priorityValue, 1);
  taskPriorityCharacteristic.setCallback(taskPriorityCallback);
  simpleCustomService.addCharacteristic(taskPriorityCharacteristic);

  byte nameValue[] = {'h', 'i'};
  taskNameCharacteristic.setValue(nameValue, 2);
  taskNameCharacteristic.setCallback(taskNameCallback);
  simpleCustomService.addCharacteristic(taskNameCharacteristic);

  byte deleteElementValue[] = {0, 0};
  deleteElementCharacteristic.setValue(deleteElementValue, 2);
  deleteElementCharacteristic.setCallback(deleteElementCallback);
  simpleCustomService.addCharacteristic(deleteElementCharacteristic);

  // Add the Service
   DuoBLE.addService(simpleCustomService);

   // Start stack
   DuoBLE.begin();

   // The Advertised name and "local" name should have some agreement
   DuoBLE.advertisingDataAddName(ADVERTISEMENT, deviceName);
   DuoBLE.setName(deviceName);

   // Start advertising.
   DuoBLE.startAdvertising();
   Serial.println("BLE start advertising.");

   Time.now();

    //creates display with current time and a default showing
    display.begin(SSD1306_SWITCHCAPVCC);
    display.clearDisplay();   // clears the screen and buffer  
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setTextWrap(true);
    display.setCursor(0,0);
    display.print("[");
    display.print("123456789123456789");
    display.println("]");
    display.println("---------------------");
    display.setCursor(0, 17);
    display.print("Due date: ");
   
    display.println(" 04/29/2017");
    
    display.print("             12:00:00");
    display.println("---------------------");
   
    display.setCursor(0,42);
    display.println("    CURRENT TIME");
    defaultDisplay();
    display.display();
}

unsigned long timeTimer = 0;

void loop() {
  // put your main code here, to run repeatedly:
  if (millis() - timeTimer >= 1000) {
    int currTime = Time.now();
    
    byte currTimeValue[4];
    currTimeValue[0] = currTime >> 24;
    currTimeValue[1] = currTime >> 16;
    currTimeValue[2] = currTime >> 8;
    currTimeValue[3] = currTime;
    currentTimeCharacteristic.setValue(currTimeValue, 4);
    currentTimeCharacteristic.sendNotify();
    timeTimer += 1000;

    time_t currT = currTime;
    display.setCursor(0,55);
    display.drawRect(0, 55, 128, 7, 0x0000);
    display.fillRect(0, 55, 128, 7, 0x0000);
    display.println(Time.format(currT, " %m/%d/%Y %H:%M:%S"));
    display.display();
  }
}


/**<-----------------on/off buttons---------------------->**/
void on_path_to_debounce() {
  on_debounce();
}

Timer on_button_timer(N, on_path_to_debounce);

void on_debounce() {

  //run snooze button and turn off buzzer
  if (digitalRead(D1) == 0) {
    Serial.println("Snooze button worked");
    noTone(D0);
    alarmDueDateArray[indexOfAlarmArray] = longTimeFromNow;
    on_button_timer.stop();
  }
  else on_button_timer.stop();
}

void onButton_call() { // this starts everything
  on_button_timer.startFromISR();
}


void off_path_to_debounce() {
  off_debounce();
}

Timer off_button_timer(N, off_path_to_debounce);

void off_debounce() {

   //if the completed button is pressed, make the display the default and delete the task
  if (digitalRead(D2) == 0) {
    Serial.println("task check mark worked");
    alarmTimer.stop();
    defaultDisplay();

// send message to app to delete the element
    off_button_timer.stop();

    boolElement = 1;

    byte deleteElementValue[2];
    deleteElementValue[0] = boolElement;
    deleteElementValue[1] = id_1;
    deleteElementCharacteristic.setValue(deleteElementValue, 2);

    deleteElementCharacteristic.sendNotify();
    Serial.println("sent notify to delete the task on app.");

    boolElement = 0;
  }
  else off_button_timer.stop();
}

void offButton_call() { // this starts everything
  off_button_timer.startFromISR();
}
/**<-----------------on/off buttons---------------------->**/



