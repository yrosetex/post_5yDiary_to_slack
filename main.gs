function myFunction() {
  
}

//-----------毎朝、過去5年分の日記をpostする。GASのトリガーを使って朝に起動する。-----------
function post5yDiary() {

//webcrow/diary/apiのAPIキー
  var strKey = PropertiesService.getScriptProperties().getProperty('DIARY_API_KEY');
  
//実行時の日付を取得
  var dt = new Date();
  var strDt = Utilities.formatDate(dt, 'JST', 'yyyy-MM-dd');
  var strDt_day = Utilities.formatDate(dt, 'JST', 'M月d日');

// 1～5年前の日記を取得
  var strBody='x年前の今日（'+strDt_day+'）の日記です。\n';
  for(var i=1;i<6;i++){
    dt.setFullYear (dt.getFullYear() - 1); //dtを1年、前に戻す
    strDt = Utilities.formatDate(dt, 'JST', 'yyyy-MM-dd');
    strDt_year = Utilities.formatDate(dt, 'JST', 'yyyy年');
   
    //MySQLがエラーを出した場合の処理
    try{
      var diary_api_url = PropertiesService.getScriptProperties().getProperty('DIARY_API_URL');
      var response = UrlFetchApp.fetch(diary_api_url + "?date=" + strDt + "&key=" + strKey);
    }
    catch(e){
      MailApp.sendEmail(PropertiesService.getScriptProperties().getProperty('MAIL_ADDR') , 'post5yDiary実行時のエラー', e);
      //Logger.log(e);
      return;
    }
    
    Utilities.sleep(1000);//連続してMySQLを呼ぶと怒られるかも知れないのでsleep      
    
    var jsonRes = JSON.parse(response.getContentText());
    strBody = strBody + '[' + i + '年前（'+strDt_year+'）の今日]' + '\n'; 
    strBody = strBody + jsonRes["memo"] + '\n';
  }

//Logger.log(strBody);
  
//slackへのpost
  var token = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
  var bot_name = "秘書bo";
  var bot_icon = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_ICON');

  var slackApp = SlackApp.create(token); //SlackApp インスタンスの取得
  var options = {
    channelId: "#diary", //チャンネル名
    userName: bot_name, //投稿するbotの名前
    message: strBody //投稿するメッセージ
  };
  slackApp.postMessage(options.channelId, options.message, {
    username: options.userName,
    icon_url: bot_icon
  });
}
