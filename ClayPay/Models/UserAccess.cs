﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.DirectoryServices.AccountManagement;

namespace ClayPay.Models
{
  public class UserAccess
  {
    private const string djournal_group = "gClayDjournal"; // We may make this an argument if we end up using this code elsewhere.
    private const string impactfee_group = "gEventImpactFee"; // We may make this an argument if we end up using this code elsewhere.

    private const string mis_access_group = "gMISDeveloper_Group"; // "gMISDevelopers";

    public bool authenticated { get; set; } = false;
    public string user_name { get; set; }
    public int employee_id { get; set; } = 0;
    public string display_name { get; set; } = "";
    public bool djournal_access = false;
    public bool impactfee_access = false;
    //public bool admin_access = false;

    public UserAccess(string name)
    {
      user_name = name;
      if (user_name.Length == 0)
      {
        user_name = "claypay";
        display_name = "Public User";
      }
      else
      {
        display_name = name;
        using (PrincipalContext pc = new PrincipalContext(ContextType.Domain))
        {
          try
          {
            var up = UserPrincipal.FindByIdentity(pc, user_name);
            ParseUser(up);
          }
          catch (Exception ex)
          {
            Constants.Log("In UserAccess() constructor,", " There is an issue finding user's access", ex.StackTrace, user_name);
          }
        }
      }
    }

    public UserAccess(UserPrincipal up)
    {
      ParseUser(up);
    }

    private void ParseUser(UserPrincipal up)
    {
      try
      {
        if (up != null)
        {
          user_name = up.SamAccountName.ToLower();
          authenticated = true;
          display_name = up.DisplayName;
          if (int.TryParse(up.EmployeeId, out int eid))
          {
            employee_id = eid;
          }
          var groups = (from g in up.GetAuthorizationGroups()
                        select g.Name).ToList();

          if(groups.Contains(mis_access_group)) 
          {
            djournal_access = true;
            impactfee_access = true;
          }
          else
          {
            djournal_access = groups.Contains(djournal_group);
            impactfee_access = groups.Contains(impactfee_group);
          }

        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex);
      }
    }
    private static void ParseGroup(string group, ref Dictionary<string, UserAccess> d)
    {
      using (PrincipalContext pc = new PrincipalContext(ContextType.Domain))
      {
        using (GroupPrincipal gp = GroupPrincipal.FindByIdentity(pc, group))
        {
          if (gp != null)
          {
            foreach (UserPrincipal up in gp.GetMembers())
            {
              if (up != null)
              {
                if (!d.ContainsKey(up.SamAccountName.ToLower()))
                {
                  d.Add(up.SamAccountName.ToLower(), new UserAccess(up));
                }
              }
            }
          }
        }
      }
    }

    public static Dictionary<string, UserAccess> GetAllUserAccess()
    {
      var d = new Dictionary<string, UserAccess>();

      try
      {
        switch (Environment.MachineName.ToUpper())
        {

          case "CLAYBCCDMZIIS01":
            d[""] = new UserAccess("");
            break;
          default:
            ParseGroup(mis_access_group, ref d);
            ParseGroup(djournal_group, ref d);
            ParseGroup(impactfee_group, ref d);

            d[""] = new UserAccess("");
            break;

        }
        return d;
      }
      catch (Exception ex)
      {
        new ErrorLog(ex);
        return null;
      }
    }

    public static UserAccess GetUserAccess(string Username)
    {
      try
      {
        string un = Username.Replace(@"CLAYBCC\", "").ToLower();
        //un = ""; /* change "" to user_name you wish to test */
        switch (Environment.MachineName.ToUpper())
        {
          case "":
          case "MISSL01":
          case "MISHL05":
            return new UserAccess(un);
          default:
            var d = GetCachedAllUserAccess();

            if (d.ContainsKey(un))
            {
              return d[un]; // we're dun
            }
            else
            {
              return d[""];
            }
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, "");
        return null;
      }
    }

    public static Dictionary<string, UserAccess> GetCachedAllUserAccess()
    {
      return (Dictionary<string, UserAccess>)MyCache.GetItem("useraccess");
    }
  }
}