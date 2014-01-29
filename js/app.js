var dcaMobile = function ()
{
    var urlDca       = "http://dca.telefonicabeta.com/m2m/v2/services/";
    var urlDcaAssets = "/assets";
    var strDcaUsername = ""

    var _login = function (pUsername, pCallback, pCallbackError)
    {
      strDcaUsername = pUsername;

      $.ajax( { url: urlDca + strDcaUsername + "/", dataType:"json" } )
      .done(function( data ) {
        pCallback(data);
      })
      .fail(function ( data ) {
        pCallbackError(data);
      });      

    };

    var _assets = function (pCallback, pCallbackError)
    {

      $.ajax( { url: urlDca + strDcaUsername + urlDcaAssets, dataType:"json" } )
      .done(function( data ) {
        pCallback(data);
      })
      .fail(function ( data ) {
        pCallbackError(data);
      });      
 
    };

    var _assetDetail = function (assetId, pCallback, pCallbackError)
    {

      $.ajax( { url: urlDca + strDcaUsername + urlDcaAssets + "/" + assetId + "/", dataType:"json" } )
      .done(function( data ) {
        pCallback(data);
      })
      .fail(function ( data ) {
        pCallbackError(data);
      });    

    };

    var _assetDetailData = function (assetId, attributeName, pCallback, pCallbackError)
    {

      $.ajax( { url: urlDca + strDcaUsername + urlDcaAssets + "/" + assetId + "/data?sortBy=!samplingTime&limit=30&offset=0&attribute=" + attributeName, dataType:"json" } )
      .done(function( data ) {
        pCallback(data);
      })
      .fail(function ( data ) {
        pCallbackError(data);
      });    
     
    };

    return {login:_login, assets:_assets, assetDetail:_assetDetail, assetDetailData:_assetDetailData};

}();

document.querySelector('#btn-dca-dashboard').addEventListener ('click', function () 
{
  var strUsername = document.querySelector('#dca_username').value;

  localStorage.setItem('dca_username', strUsername);

  dcaMobile.login(strUsername, function (objReturn)
  {
      document.querySelector('#dca-dashboard').className = 'current';
      document.querySelector('[data-position="current"]').className = 'left';
      var animend = (/webkit/i).test(navigator.appVersion) ? 'webkitAnimationEnd' : 'animationend';
      document.addEventListener(animend, function animationend() {
        document.removeEventListener(animend, animationend);
        utils.seekbars.init();
      });

      dcaMobile.assets(function (objResponse)
        {
          var dcaAssetsList = document.querySelector('#dca-assets-list');
          var dcaAssetsLabel = document.querySelector('#dca-assets-label');

          if (objResponse["count"] == 0)
          {
            dcaAssetsLabel.innerHTML = "Nenhum dispositivo encontrado";
          }
          else if (objResponse["count"] == 1)
          {
            dcaAssetsLabel.innerHTML = "Um dispositivo encontrado";
          }
          else
          {
            dcaAssetsLabel.innerHTML = objResponse["count"] + " dispositivos encontrados";
          }

          dcaAssetsList.innerHTML = "";

          for (var i in objResponse["data"])
          {
            var asset = objResponse["data"][i]["asset"];
            var item  = document.createElement('li');
            var item_a = document.createElement('a');
            var item_p = document.createElement('p');
            item_p.innerHTML = asset.name;

            item_a.id = asset.name;
            item_a.setAttribute("data-assetId", asset.name);
            item_a.appendChild(item_p);
            item.appendChild(item_a);
            dcaAssetsList.appendChild(item);

            item_a.addEventListener ('click', function () {
              document.querySelector('#dca-dashboard-asset').className = 'current';
              document.querySelector('[data-position="current"]').className = 'left';
              document.querySelector('#dca-dashboard-asset-name').innerHTML = this.id;

              document.querySelector('#btn-dca-dashboard-asset-back').addEventListener('click', function () {
                document.querySelector('#dca-dashboard-asset').className = 'right';
                document.querySelector('#dca-dashboard').className = 'current';
              });

              var self = this;
              dcaMobile.assetDetail(self.id, function (objResp)
              {
                var dcaAssetSensorsList = document.querySelector('#dca-dashboard-asset-sensors-list');
                dcaAssetSensorsList.innerHTML = "";
                var sensorData = objResp.data["sensorData"];
                if (sensorData.length == 0)
                {
                    utils.status.show('Oops! Ainda não recebemos medidas deste dispositivo.');    
                    document.querySelector('#dca-dashboard-asset').className = 'right';
                    document.querySelector('#dca-dashboard').className = 'current';
                }
                else
                {
                for (var e in sensorData)
                  {
                    var sensor = sensorData[e]["ms"];
                    var item  = document.createElement('li');
                    var item_a = document.createElement('a');
                    var item_p = document.createElement('p');
                    item_p.innerHTML = sensor["p"];
                    item_a.id = sensor["p"];
                    item_a.setAttribute("data-assetId", self.getAttribute("data-assetId"));
                    item_a.setAttribute("data-sensorId", sensor["p"]);
                    item_a.appendChild(item_p);
                    item.appendChild(item_a);
                    dcaAssetSensorsList.appendChild(item);
                    item_a.addEventListener ('click', function () {

                      document.querySelector('#dca-dashboard-asset-detail').className = 'current';
                      document.querySelector('[data-position="current"]').className = 'left';
                      document.querySelector('#dca-dashboard-asset-detail-name').innerHTML = this.getAttribute("data-assetId") + " &middot; " + this.getAttribute("data-sensorId");

                      document.querySelector('#btn-dca-dashboard-asset-detail-back').addEventListener('click', function () {
                        if (window.screen.mozUnlockOrientation)
                        window.screen.mozUnlockOrientation("landscape-primary");
                        document.querySelector('#dca-dashboard-asset-detail').className = 'right';
                        document.querySelector('#dca-dashboard-asset').className = 'current';
                        clearInterval(dcaGraphInterval);
                      });


                      if (window.screen.mozLockOrientation)
                        window.screen.mozLockOrientation("landscape-primary");

                      var self = this;
                      var dcaGraph = function ()
                      {
                        dcaMobile.assetDetailData(self.getAttribute("data-assetId"), self.getAttribute("data-sensorId"), function (objRespData)
                        {

                          var graphData = [];

                          for (var g in objRespData["data"])
                          {
                            var item = objRespData["data"][g];
                            graphData[graphData.length] = {"period": item["st"], "measure": item["ms"]["v"]};
                          }

                          document.querySelector('#graph').innerHTML = "";
                          Morris.Line({
                            pointSize: 4,
                            ymin: 'auto',
                            xLabels: "1min",
                            element: 'graph',
                            data: graphData,
                            xkey: 'period',
                            ykeys: ['measure'],
                            labels: ['Measure']
                          });


                        }, function (error) {
                          utils.status.show('Oops! Erro ao tentar carregar os dados... ');    
                        });

                      };

                      var dcaGraphInterval = setInterval(function () {
                        utils.status.show('Atualizando...');    
                        dcaGraph();
                      }, 10000);
                      dcaGraph();

                    });
                  }
                }

              }, function (error)
              {
                utils.status.show('Oops! Erro ao tentar carregar os dados... ');    
              });

              return false;

            });

          }
        }, function (error)
        {
          utils.status.show('Oops! Erro ao tentar carregar os dados... ');    
        });

  }, function (error)
  {
      utils.status.show('Usuário e/ou Senha inválidos!');    
  });


});

document.querySelector('#btn-dca-dashboard-back').addEventListener ('click', function () {
  document.querySelector('#dca-dashboard').className = 'right';
  document.querySelector('[data-position="current"]').className = 'current';
});


window.onload = function()
{
  strDcaUsername = localStorage.getItem("dca_username");

  document.querySelector('#dca_username').value = strDcaUsername;
}

