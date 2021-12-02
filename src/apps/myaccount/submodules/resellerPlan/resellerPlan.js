define(function(require){
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var resellerPlan = {

		requests: {
			'virtualpbx.billing.get_info': {
				apiRoot: 'https://us-central1-core-voice.cloudfunctions.net/billing-view-account-info?account_Id={account_id}',
				url: '',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID',
					'X-Auth-Token',
					'Content-Type'
				]
			},
			'virtualpbx.billing.get_payments': {
				apiRoot: 'https://us-central1-core-voice.cloudfunctions.net/billing-view-recent-invoices?account_Id={account_id}',
				url: '',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID',
					'X-Auth-Token',
					'Content-Type'
				]
			}
		},

		subscribe: {
			'myaccount.resellerPlan.renderContent': '_resellerPlanRenderContent'
		},

		_resellerPlanRenderContent: function(args){
			var self = this;

			self.resellerPlanGetData(function(data) {
				var resellerPlanTemplate = $(self.getTemplate({
					name: 'layout',
					data: data,
					submodule: 'resellerPlan'
				}));

				self.accountBindEvents(resellerPlanTemplate, data);

				monster.pub('myaccount.renderSubmodule', resellerPlanTemplate);
				
				args.callback && args.callback(resellerPlanTemplate);
			});
		},

		resellerPlanBindEvents: function(template, data) {
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

		resellerPlanGetData: function(globalCallback) {
			var self = this;
			
			var defaults = {
				bill_cycle_month: new Date(),
				
			}

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
					billing: function(callback) {
						monster.request({
							resource: 'virtualpbx.billing.get_info',
							data: {
								"account_id": self.accountId
							},
							success: function(data, status) {
								callback && callback(null, data);
							},
							error: function(data, status) {
								callback && callback(null, null);
							}
						});
					}
				},
				function(err, results) {
					self.resellerPlanFormatData(results, globalCallback);
				}
			);
		},

		resellerPlanFormatData: function(data, globalCallback) {
			var self = this;
			
			if (data.billing != null) {
				var billCycleDate = data.billing.BillingDate;
				var balance = data.billing.AccountBalance || 0;

				var now = new Date();
				if (now.getMonth() == 11) {
					var current = new Date(now.getFullYear() + 1, 0, billCycleDate);
				} else {
					var current = new Date(now.getFullYear(), now.getMonth() + 1, billCycleDate);
				}

				data.billing.AccountBalance = monster.util.formatPrice({ style: 'currency', price: balance, digits: 2 }); 
				data.billing.billCycleDate = current.toLocaleDateString(); 
			}
			globalCallback && globalCallback(data);
		}
	};

	return resellerPlan;
});