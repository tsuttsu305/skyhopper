//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//


(function () {
  'use strict';

// ================================================================
// infrastructures
// ================================================================

//browserify functions for vue filters functionality
  //var infraindex = require('./modules/loadindex');
  var queryString = require('query-string').parse(location.search);
  //browserify modules for Vue directives
  var Infrastructure = require('models/infrastructure').default;
  var modal          = require('modal');

  Vue.use(require('./modules/datepicker'), queryString.lang);
  Vue.use(require('./modules/timepicker'), queryString.lang);

  var vace = require('vue-ace');
  require('brace/mode/json');
  require('brace/theme/github');
  Vue.use(vace, false, 'json', '25');


  Vue.component('stack-events-table',         require('infrastructures/stack-events-table.js'));
  Vue.component('add-modify-tabpane',         require('infrastructures/add-modify-tabpane.js'));
  Vue.component('insert-cf-params',           require('infrastructures/insert-cf-params.js'));
  Vue.component('add-ec2-tabpane',            require('infrastructures/add-ec2-tabpane.js'));
  Vue.component('cf-history-tabpane',         require('infrastructures/cf-history-tabpane.js'));
  Vue.component('infra-logs-tabpane',         require('infrastructures/infra-logs-tabpane.js'));
  Vue.component('monitoring-tabpane',         require('infrastructures/monitoring-tabpane.js'));
  Vue.component('edit-monitoring-tabpane',    require('infrastructures/edit-monitoring-tabpane.js'));
  Vue.component('rds-tabpane',                require('infrastructures/rds-tabpane.js'));
  Vue.component('elb-tabpane',                require('infrastructures/elb-tabpane.js'));
  Vue.component('s3-tabpane',                 require('infrastructures/s3-tabpane.js'));
  Vue.component('view-rules-tabpane',         require('infrastructures/view-rules-tabpane.js'));
  Vue.component('security-groups-tabpane',    require('infrastructures/security-groups-tabpane.js'));
  Vue.component('ec2-tabpane',                require('infrastructures/ec2-tabpane.js'));
  Vue.component('edit-runlist-tabpane',       require('infrastructures/edit-runlist-tabpane.js'));
  Vue.component('edit-attr-tabpane',          require('infrastructures/edit-attr-tabpane.js'));
  Vue.component('serverspec-results-tabpane', require('infrastructures/serverspec-results-tabpane.js'));
  Vue.component('serverspec-tabpane',         require('infrastructures/serverspec-tabpane.js'));
  Vue.component('operation-sched-tabpane',    require('infrastructures/operation-sched-tabpane.js'));
  Vue.component('demo-grid',                  require('infrastructures/demo-grid.js'));



  var show = require('infrastructures/show_infra.js');
  var show_infra = show.show_infra;
  var SHOW_INFRA_ID = show.SHOW_INFRA_ID;

  var detach = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.detach_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.text = "Loading...";
      l.$mount(SHOW_INFRA_ID);
      infra.detach().done(function (msg) {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(function () {
          location.reload();
        });
      }).fail(modal.AlertForAjaxStdError()).always(l.$destroy);
    });
  };

  var delete_stack = function (infra_id) {
    modal.Confirm(t('infrastructures.infrastructure'), t('infrastructures.msg.delete_stack_confirm'), 'danger').done(function () {
      var infra = new Infrastructure(infra_id);
      var l = new Loader();
      l.text = "Loading...";
      l.$mount(SHOW_INFRA_ID);
      infra.delete_stack().done(function (msg) {
        modal.Alert(t('infrastructures.infrastructure'), msg).done(function () {
          show_infra(infra_id);
        });
        // TODO: reload
      }).fail(modal.AlertForAjaxStdError(function () {
        show_infra(infra_id);
      })).always(l.$destroy);
    });
  };


  // for infrastructures#new
  var new_ec2_key = function () {
    modal.Confirm(t('infrastructures.infrastructure'), t('ec2_private_keys.confirm.create')).then(function () {
      return modal.Prompt(t('infrastructures.infrastructure'), t('app_settings.keypair_name'));
    }).then(function (name) {
      if(!name){
        modal.Alert(t('infrastructures.infrastructure'), t('ec2_private_keys.msg.please_name'), 'danger');
        return;
      }

      var region_input = $('#infrastructure_region');
      var region = region_input.val();
      var project_id = $('#infrastructure_project_id').val();

      return $.ajax({
        url: '/ec2_private_keys',
        type: 'POST',
        data: {
          name:       name,
          region:     region,
          project_id: project_id,
        },
      });
    }).done(function (key) {
      var value = key.value;
      var textarea = $('#keypair_value');
      var keypair_name = $('#keypair_name');
      textarea.val(value);
      textarea.attr('readonly', true);
      keypair_name.val(name);
      keypair_name.attr('readonly', true);
      region_input.attr('readonly', true);

      // download file.
      var file = new File([value], name + '.pem');
      var url = window.URL.createObjectURL(file);
      var a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', file.name);
      document.body.appendChild(a);
      a.click();
    }).fail(function (xhr) {
      modal.Alert(t('infrastructures.infrastructure'), xhr.responseText, 'danger');
    });
  };

  Vue.transition('fade', {
    leave: function (el, done) {
      $(el).fadeOut('normal');
    }
  });

// ================================================================
// event bindings
// ================================================================
  var index = new Vue({
    el: '#indexElement',
    data: {
      searchQuery: '',
      gridColumns: [],
      gridData: []
    },
    created: function(){
        if (queryString.project_id >3)
          this.gridColumns = ['stack_name','region', 'keypairname', 'created_at', 'status', 'id'];
        else
          this.gridColumns = ['stack_name','region', 'keypairname', 'id'];
    },
  });


  $(document).ready(function(){

    $('#infrastructure_region').selectize({
      create: false,
      sortField: 'text'
    });
    moment.locale(queryString.lang);


  });

  $(document).on('click', '.show-infra', function (e) {
    e.preventDefault();
    $(this).closest('tbody').children('tr').removeClass('info');
    $(this).closest('tr').addClass('info');
    var infra_id = $(this).attr('infrastructure-id');
    show_infra(infra_id, '');
  });

  $(document).on('click', '.operation-sched', function (e) {
    e.preventDefault();
    $(this).closest('tbody').children('tr').removeClass('info');
    $(this).closest('tr').addClass('info');
    var infra_id = $(this).attr('infrastructure-id');
    show_infra(infra_id, 'show_sched');
  });

  $(document).on('click', '.detach-infra', function (e) {
    e.preventDefault();
    var infra_id = $(this).attr('infrastructure-id');

    detach(infra_id);
  });

  $(document).on('click', '.delete-stack', function (e) {
    e.preventDefault();
    var infra_id = $(this).attr('infrastructure-id');

    delete_stack(infra_id);
  });

  $(document).on('click', '.create_ec2_key', function (e) {
    e.preventDefault();
    new_ec2_key();
  });



})();
