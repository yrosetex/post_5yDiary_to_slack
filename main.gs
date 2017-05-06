function myFunction() {
  
}

//このファイル外で必要な設定は下記。
//(1)スクリプトプロパティの設定。Gas_Properties/send_5yCal_to_Slack.txtを参照。
//(2)ライブラリの導入。参考URL: http://qiita.com/soundTricker/items/43267609a870fc9c7453
//　手順：
//　　GAS Editorを開きます。
//　　上のメニューから「リソース」→「ライブラリを管理...」を選択します。
//　　「含まれているライブラリ」というダイアログが表示されるので下にある「ライブラリを検索」横のテキストボックスに「M3W5Ut3Q39AaIwLquryEPMwV62A3znfOO」を入力します。(この値をプロジェクトキーと言います)
//　　「選択」ボタンを押して少し待つと、上の一覧にタイトル underscoreGSというのが出ます。
//　　「バージョン」欄で任意のバージョンを選択します。最新でいいと思います。
//　　下にある「保存」ボタンを押します。 ※他の物については後で説明します。
//　　開いていたダイアログが閉じ、ライブラリが取り込まれた旨が表示されたらOKです。
//(3)トリガーの設定
//　手順：
//　　GAS Editorを開く。
//　　編集→現在のプロジェクトのトリガー、「トリガーが設定されていません。今すぐ追加するにはここをクリックしてください。」をクリック。

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
