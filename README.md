# TouchSound
--------------------
<br/>

## TouchSound Project Description
-------------

<img src="https://user-images.githubusercontent.com/46099642/114053045-8b6da800-98c9-11eb-8ba9-eccd36f3ac38.JPG">
<br/>
Web Audio Editor 웹 오디오 에디터

## Development Environment
---------------------

- Visual Studio Code
- Language: Javascript (ECMAScript 6)
- Chrome Browser
<br/>

## Live Server Installation for Execution
---------------------

<img src="https://user-images.githubusercontent.com/46099642/114054249-a7257e00-98ca-11eb-800a-f4864e3613ff.JPG">
<br/>

Install Live Server
<br/>
Then execute TouchSound with the command below in the project directory

```
live-server
```

## Application Execution Flow
---------------------

TouchSound는 다중 트랙을 지원합니다. 여러 음원을 함께 업로드하여 한꺼번에 작업할 수 있습니다.
채널이 2개 이상일 경우 각 채널별 파형을 보여줍니다.

현재까지 작업한 트랙들을 하나의 파일로 저장
<br/>
현재 선택한 빈 트랙에 녹음
<br/>
Play, Pause, Stop
<br/>
<br/>
<img src="https://user-images.githubusercontent.com/46099642/114125160-dc64b700-9930-11eb-8959-ac95303edf3c.JPG">
<br/>

가로 방향 줌과 세로 방향 줌 (모든 트랙에 일괄 적용)
<br/>
<br/>
<img src="https://user-images.githubusercontent.com/46099642/114125606-cb687580-9931-11eb-9e72-3554d501c60f.JPG">
<br/>

Edit Mode가 트랙이면 트랙 단위로 영역 선택(드래그), 복사, 잘라내기, 붙여넣기, 지우기를 수행합니다.
<br/>
채널 수가 다른 트랙끼리는 복사 붙여넣기를 할 수 없습니다.
<br/>
<br/>
<img src="https://user-images.githubusercontent.com/46099642/114125732-fce14100-9931-11eb-9d60-a78639ddd049.JPG">
<br/>
<img src="https://user-images.githubusercontent.com/46099642/114125734-fe126e00-9931-11eb-8840-7a1cbb3041f8.JPG">
   
Edit Mode가 채널이면 채널 단위로 영역 선택(드래그), 복사, 잘라내기, 붙여넣기, 지우기를 수행합니다.
<br/>
<br/>
<img src="https://user-images.githubusercontent.com/46099642/114125782-197d7900-9932-11eb-9b4e-36a13630292a.JPG">
<br/>
<img src="https://user-images.githubusercontent.com/46099642/114125783-1a160f80-9932-11eb-9ed7-af34bd041904.JPG">

3. 파일 불러오기   
각 트랙마다 원하는 음원 파일을 선택하여 불러올 수 있습니다.
   
4. 녹음   
각 트랙마다 원하는 시점에서 녹음할 수 있습니다.
   
5. 편집 모드 전환 지원 (트랙/채널)   
편집 시 트랙 단위나 채널 단위 중에서 편집 모드를 설정할 수 있습니다.
   
6. 편집 (자르고 붙이기)   
트랙이나 채널의 영역을 드래그로 선택한 뒤 해당 영역을 복사하거나 자를 수 있고,
이를 원하는 트랙의 원하는 위치에 붙여넣기할 수 있습니다.

7. 줌 기능   
편집의 편의를 위해서 가로 방향이나 세로 방향으로 줌 인/아웃 기능을 제공합니다.
   
8. 볼륨 조절   
각 트랙마다 볼륨을 조절할 수 있습니다.
   
9. 배속/감속   
각 트랙마다 배속/감속을 조절할 수 있습니다.
   
10. 재생   
업로드된 모든 트랙들을 한꺼번에 재생합니다.
   
11. 파일 저장   
업로드된 모드 트랙들을 하나의 파일로 합쳐 저장합니다.

