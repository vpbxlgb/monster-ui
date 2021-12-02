define(function(require){
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var resellerUsage = {

		subscribe: {
			'myaccount.resellerUsage.renderContent': '_resellerUsageRenderContent'
		},

		_resellerUsageRenderContent: function(args){
			var self = this;

			self.resellerUsageGetData(function(data) {
				
				var resellerUsageTemplate = $(monster.template(self, 'resellerUsage-layout', data));

				self.accountBindEvents(resellerUsageTemplate, data);

				monster.pub('myaccount.renderSubmodule', resellerUsageTemplate);

				args.callback && args.callback(resellerUsageTemplate);
			});
		},

		resellerUsageBindEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#account_timezone'), data.account.timezone);
			template.find('#account_timezone').chosen({ search_contains: true, width: '220px' });

			//Temporary button design fix until we redesign the Accounts Manager
			template.find('#accountsmanager_carrier_save')
					.removeClass('btn btn-success')
					.addClass('monster-button-success');

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		},

		accountGetNoMatch: function(callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: self.accountId,
					filters: {
						filter_numbers: 'no_match'
					}
				},
				success: function(listCallflows) {
					if(listCallflows.data.length === 1) {
						self.callApi({
							resource: 'callflow.get',
							data: {
								callflowId: listCallflows.data[0].id,
								accountId: self.accountId
							},
							success: function(callflow) {
								callback(callflow.data);
							}
						});
					}
					else {
						callback({});
					}
				}
			});
		},

		resellerUsageGetData: function(globalCallback) {
			var self = this;

			monster.parallel({
					account: function(callback) {
						self.callApi({
							resource: 'account.get',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback && callback(null, data.data);
							}
						});
					},
					noMatch: function(callback) {
						self.accountGetNoMatch(function(data) {
							callback && callback(null, data);
						})
					}
				},
				function(err, results) {
					self.resellerUsageFormatData(results, globalCallback);
				}
			);
		},

		resellerUsageFormatData: function(data, globalCallback) {
			var self = this;
			
			var conus_minutes =   data.account.reseller_account.usage.traffic.domestic;
			var intl_minutes = data.account.reseller_account.usage.traffic.international;
			var voip_minutes = data.account.reseller_account.usage.traffic.voip;
			// var total_minutes = conus_minutes + intl_minutes + voip_minutes;
			
			// data.account.reseller_account.usage.traffic.billable_minutes = conus_minutes + intl_minutes; 
			// data.account.reseller_account.usage.traffic.total_minutes = total_minutes;

			globalCallback && globalCallback(data);
		}
	};

	return resellerUsage;
});