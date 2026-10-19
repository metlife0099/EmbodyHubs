import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignSchema,subscriberGroupSchema } from '../src/schemas/newsletter.js';
import { buildCampaignHtml } from '../src/services/campaignDeliveryService.js';

const campaign={
  name:'October product update',
  type:'PRODUCT_ARRIVAL',
  subject:'A new arrival from EMBODY',
  previewText:'Discover the latest addition.',
  content:{eyebrow:'New arrival',headline:'Meet a new care essential',body:'A useful update for your daily routine.',imageUrl:'',ctaLabel:'Explore online care',ctaUrl:'https://example.com/online-care'},
  audience:{type:'ALL_ACTIVE',subscriberIds:[],group:'',filters:{syncStatus:'ANY',source:'ANY',joinedAfter:'',joinedBefore:''}}
};

test('accepts a production campaign with an active consent audience',()=>{const result=campaignSchema.parse(campaign);assert.equal(result.type,'PRODUCT_ARRIVAL');assert.equal(result.audience.type,'ALL_ACTIVE')});
test('requires selected campaigns to include at least one subscriber',()=>{const result=campaignSchema.safeParse({...campaign,audience:{...campaign.audience,type:'SELECTED'}});assert.equal(result.success,false)});
test('requires CTA label and HTTPS URL together',()=>{const result=campaignSchema.safeParse({...campaign,content:{...campaign.content,ctaUrl:''}});assert.equal(result.success,false)});
test('validates a reusable subscriber group',()=>{const result=subscriberGroupSchema.parse({name:'Launch preview',description:'Early product news',subscriberIds:['68ed1234567890abcdef1234']});assert.equal(result.subscriberIds.length,1)});
test('campaign email escapes stored content and includes unsubscribe control',()=>{const html=buildCampaignHtml({...campaign,content:{...campaign.content,headline:'Safe <script>alert(1)</script>'}});assert.doesNotMatch(html,/<script>/);assert.match(html,/{{ unsubscribe }}/)});
