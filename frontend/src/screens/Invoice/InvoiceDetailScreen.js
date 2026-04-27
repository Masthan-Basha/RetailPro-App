import React,{useState,useEffect} from 'react';
import {View,Text,ScrollView,TouchableOpacity,StyleSheet,Alert,ActivityIndicator} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenHeader from '../../components/ScreenHeader';
import Badge from '../../components/Badge';
import {useTheme} from '../../context/ThemeContext';
import {invoiceAPI} from '../../utils/api';
import {formatCurrency,formatDate} from '../../utils/format';
import {buildInvoiceHtml} from '../../utils/invoiceHtml';
import {SPACING,RADIUS} from '../../utils/theme';
import {useAuth} from '../../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import {useTranslate} from '../../hooks/useTranslate';

export default function InvoiceDetailScreen({route,navigation}){
  const {theme}=useTheme();
  const {T}=useTranslate();
  const {user}=useAuth();
  const [invoice,setInvoice]=useState(route.params?.invoice||null);
  const [loading,setLoading]=useState(!route.params?.invoice);
  const [downloading,setDownloading]=useState(false);

  useEffect(()=>{
    if(!invoice){
      (async()=>{
        try{
          const res=await invoiceAPI.getAll();
          const found=(res.data||[]).find(i=>(i._id||i.id)===route.params?.id);
          if(found) setInvoice(found);
        }catch(e){console.error(e);}
        finally{setLoading(false);}
      })();
    }
  },[]);

  const handleDownload=async()=>{
    if(!invoice) return;
    setDownloading(true);
    try{
      const html=buildInvoiceHtml(invoice,user?.shopName||'RetailPro Store');
      const {uri}=await Print.printToFileAsync({html,base64:false});
      const canShare=await Sharing.isAvailableAsync();
      if(canShare){
        await Sharing.shareAsync(uri,{mimeType:'application/pdf',dialogTitle:`Invoice ${invoice.invoiceNumber||''}`});
      } else {
        Alert.alert('Saved',`PDF saved to: ${uri}`);
      }
    }catch(err){
      Alert.alert('Error','Could not generate PDF. '+err.message);
    }finally{setDownloading(false);}
  };

  if(loading) return(
    <View style={[styles.center,{backgroundColor:theme.bgBase}]}>
      <ActivityIndicator color={theme.accent} size="large"/>
    </View>
  );

  if(!invoice) return(
    <View style={[styles.center,{backgroundColor:theme.bgBase}]}>
      <Text style={[styles.emptyText,{color:theme.textMuted}]}>{T('no_data')}</Text>
    </View>
  );

  const items=Array.isArray(invoice.items)?invoice.items:(typeof invoice.items==='string'?JSON.parse(invoice.items):[]);

  return(
    <View style={[styles.container,{backgroundColor:theme.bgBase}]}>
      <ScreenHeader title={invoice.invoiceNumber||'Invoice'} subtitle={formatDate(invoice.createdAt)} onBack={()=>navigation.goBack()}
        action={
          <TouchableOpacity style={[styles.dlBtn,{backgroundColor:theme.accent}]} onPress={handleDownload} disabled={downloading}>
            {downloading?<ActivityIndicator color="#fff" size="small"/>:<><Feather name="download" size={14} color="#fff"/><Text style={styles.dlTxt}> PDF</Text></>}
          </TouchableOpacity>
        }/>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Status + Meta */}
        <View style={[styles.card,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
          <View style={styles.cardRow}>
            <View>
              <Text style={[styles.label,{color:theme.textMuted}]}>{T('amount')}</Text>
              <Text style={[styles.invNum,{color:theme.accent}]}>{invoice.invoiceNumber||'—'}</Text>
            </View>
            <Badge status={invoice.status||'pending'}/>
          </View>
          <View style={[styles.divider,{backgroundColor:theme.border}]}/>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={[styles.label,{color:theme.textMuted}]}>{T('customers')}</Text>
              <Text style={[styles.metaVal,{color:theme.textPrimary}]}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.label,{color:theme.textMuted}]}>{T('status')}</Text>
              <Text style={[styles.metaVal,{color:theme.textPrimary,textTransform:'capitalize'}]}>{invoice.paymentMode||'cash'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.label,{color:theme.textMuted}]}>Tax</Text>
              <Text style={[styles.metaVal,{color:theme.textPrimary}]}>{invoice.isTaxFree?'Tax-Free':'With GST'}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <Text style={[styles.sec,{color:theme.textPrimary}]}>{T('customers')}</Text>
        <View style={[styles.card,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
          <Text style={[styles.custName,{color:theme.textPrimary}]}>{invoice.customerName||'—'}</Text>
          {invoice.customerPhone&&<Text style={[styles.custSub,{color:theme.textMuted}]}>📞 {invoice.customerPhone}</Text>}
          {invoice.customerAddress&&<Text style={[styles.custSub,{color:theme.textMuted}]}>📍 {invoice.customerAddress}</Text>}
        </View>

        {/* Items Table */}
        <Text style={[styles.sec,{color:theme.textPrimary}]}>{T('inventory')}</Text>
        <View style={[styles.card,{backgroundColor:theme.bgCard,borderColor:theme.border,padding:0,overflow:'hidden'}]}>
          {/* Table Header */}
          <View style={[styles.tableHead,{backgroundColor:theme.accent}]}>
            <Text style={[styles.thItem,{color:'#fff'}]}>{T('item_name')}</Text>
            <Text style={[styles.thQty,{color:'#fff'}]}>Qty</Text>
            <Text style={[styles.thPrice,{color:'#fff'}]}>{T('price')}</Text>
            <Text style={[styles.thTotal,{color:'#fff'}]}>{T('amount')}</Text>
          </View>
          {items.map((it,idx)=>{
            const lineTotal=Number(it.qty||1)*Number(it.price||0);
            const lineTax=invoice.isTaxFree?0:lineTotal*(it.gst||0)/100;
            return(
              <View key={idx} style={[styles.tableRow,idx%2===1&&{backgroundColor:theme.bgElevated},{borderBottomColor:theme.border,borderBottomWidth:1}]}>
                <View style={styles.tdItem}>
                  <Text style={[styles.itemName,{color:theme.textPrimary}]}>{it.name}</Text>
                  {it.hsnCode&&<Text style={[styles.itemSub,{color:theme.textMuted}]}>HSN: {it.hsnCode} · GST: {it.gst||0}%</Text>}
                </View>
                <Text style={[styles.tdQty,{color:theme.textSecondary}]}>{it.qty||1} {it.unit||'pcs'}</Text>
                <Text style={[styles.tdPrice,{color:theme.textSecondary}]}>₹{Number(it.price||0).toFixed(0)}</Text>
                <Text style={[styles.tdTotal,{color:theme.textPrimary}]}>{formatCurrency(lineTotal+lineTax)}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <Text style={[styles.sec,{color:theme.textPrimary}]}>{T('sales_perf')}</Text>
        <View style={[styles.card,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
          {[
            ['Subtotal',formatCurrency(invoice.subtotal||0),theme.textPrimary],
            ['GST',formatCurrency(invoice.taxTotal||0),theme.textSecondary],
          ].map(([l,v,c])=>(
            <View key={l} style={styles.sumRow}>
              <Text style={[styles.sumL,{color:theme.textSecondary}]}>{l}</Text>
              <Text style={[styles.sumV,{color:c}]}>{v}</Text>
            </View>
          ))}
          <View style={[styles.sumRow,styles.grandRow,{borderTopColor:theme.border}]}>
            <Text style={[styles.grandL,{color:theme.textPrimary}]}>{T('month_revenue')}</Text>
            <Text style={[styles.grandV,{color:theme.textPrimary}]}>{formatCurrency(invoice.grandTotal||0)}</Text>
          </View>
          <View style={[styles.divider,{backgroundColor:theme.border}]}/>
          <View style={styles.sumRow}>
            <Text style={[styles.sumL,{color:theme.textSecondary}]}>{T('amount')}</Text>
            <Text style={[styles.sumV,{color:theme.green}]}>{formatCurrency(invoice.amountPaid||0)}</Text>
          </View>
          <View style={[styles.balRow,{backgroundColor:Number(invoice.balance||0)>0?theme.amberBg:theme.greenBg}]}>
            <Text style={[styles.balL,{color:Number(invoice.balance||0)>0?theme.amber:theme.green}]}>
              {Number(invoice.balance||0)>0?T('pending_pay'):'Paid'}
            </Text>
            <Text style={[styles.balV,{color:Number(invoice.balance||0)>0?theme.amber:theme.green}]}>
              {formatCurrency(Math.abs(invoice.balance||0))}
            </Text>
          </View>
        </View>

        {invoice.notes?<Text style={[styles.notes,{color:theme.textMuted,borderColor:theme.border}]}>{invoice.notes}</Text>:null}

        {/* PDF Button */}
        <TouchableOpacity style={[styles.bigDlBtn,{backgroundColor:theme.accent}]} onPress={handleDownload} disabled={downloading}>
          {downloading?<ActivityIndicator color="#fff"/>:<><Feather name="download" size={18} color="#fff"/><Text style={styles.bigDlTxt}>  Download Invoice PDF</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,paddingTop:25},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  emptyText:{fontSize:14},
  content:{padding:SPACING.md,paddingBottom:60},
  dlBtn:{flexDirection:'row',alignItems:'center',borderRadius:RADIUS.md,paddingHorizontal:12,paddingVertical:7},
  dlTxt:{color:'#fff',fontSize:13,fontWeight:'700'},
  sec:{fontSize:15,fontWeight:'700',marginTop:SPACING.md,marginBottom:SPACING.sm},
  card:{borderRadius:RADIUS.lg,borderWidth:1,padding:SPACING.md,marginBottom:SPACING.sm},
  cardRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  invNum:{fontSize:18,fontWeight:'700',marginTop:2},
  divider:{height:1,marginVertical:SPACING.sm},
  metaGrid:{flexDirection:'row',gap:SPACING.sm},
  metaItem:{flex:1},
  label:{fontSize:10,fontWeight:'600',textTransform:'uppercase',letterSpacing:0.5,marginBottom:3},
  metaVal:{fontSize:13,fontWeight:'600'},
  custName:{fontSize:15,fontWeight:'700',marginBottom:4},
  custSub:{fontSize:12,marginTop:2},
  tableHead:{flexDirection:'row',padding:SPACING.sm},
  thItem:{flex:2,fontSize:11,fontWeight:'700'},
  thQty:{width:60,fontSize:11,fontWeight:'700',textAlign:'center'},
  thPrice:{width:60,fontSize:11,fontWeight:'700',textAlign:'right'},
  thTotal:{width:70,fontSize:11,fontWeight:'700',textAlign:'right'},
  tableRow:{flexDirection:'row',paddingHorizontal:SPACING.sm,paddingVertical:SPACING.sm,alignItems:'center'},
  tdItem:{flex:2},
  itemName:{fontSize:13,fontWeight:'600'},
  itemSub:{fontSize:10,marginTop:1},
  tdQty:{width:60,fontSize:12,textAlign:'center'},
  tdPrice:{width:60,fontSize:12,textAlign:'right'},
  tdTotal:{width:70,fontSize:13,fontWeight:'700',textAlign:'right'},
  sumRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:SPACING.sm},
  sumL:{fontSize:14},
  sumV:{fontSize:14,fontWeight:'600'},
  grandRow:{borderTopWidth:1,paddingTop:SPACING.sm,marginTop:2},
  grandL:{fontSize:16,fontWeight:'700'},
  grandV:{fontSize:18,fontWeight:'700'},
  balRow:{flexDirection:'row',justifyContent:'space-between',padding:SPACING.md,borderRadius:RADIUS.md,marginTop:SPACING.sm},
  balL:{fontSize:13,fontWeight:'600'},
  balV:{fontSize:15,fontWeight:'700'},
  notes:{fontSize:12,fontStyle:'italic',borderWidth:1,borderRadius:RADIUS.md,padding:SPACING.md,marginBottom:SPACING.md},
  bigDlBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',padding:SPACING.md,borderRadius:RADIUS.md,marginTop:SPACING.sm},
  bigDlTxt:{color:'#fff',fontSize:15,fontWeight:'700'},
});
